const fs = require('fs')
const slugify = require('slugify')
const path = require('path')

module.exports = async ({ github, context, core }) => {
  const getEnvVar = (key) => process.env[key] !== 'null' ? process.env[key] : null

  const orgName = process.env.ORG_NAME
  const orgUrl = process.env.ORG_URL
  const orgImage = process.env.ORG_IMAGE
  const orgPhase = process.env.ORG_PHASE
  const orgUserCount = getEnvVar('ORG_USER_COUNT')
  const orgEnrolledUserCount = getEnvVar('ORG_ENROLLED_USER_COUNT')
  const orgTokens = getEnvVar('ORG_TOKENS')

  // Verify orgUrl is a valid URL including the protocol
  if (!URL.canParse(orgUrl) || new URL(orgUrl).protocol !== 'https:') {
    github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: `The provided Organization URL is invalid. Please provide a valid URL starting with https://. Please open a new PR with the correct URL.`,
    })
    github.rest.issues.update({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: context.payload.issue.labels.map(label => label.name).concat(['invalid']),
      state: 'closed',
    })
    return false
  }

  // Validate org user count being a valid number
  if (orgUserCount && isNaN(orgUserCount) || orgEnrolledUserCount && isNaN(orgEnrolledUserCount)) {
    github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: `The provided Organization User Count or Enrolled User Count is invalid. Please provide a valid number or leave it empty. Please open a new PR with the correct number.`,
    })
    github.rest.issues.update({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: context.payload.issue.labels.map(label => label.name).concat(['invalid']),
      state: 'closed',
    })
    return false
  }

  // Slugify the org name
  const orgNameSlug = slugify(orgName, { lower: true })
  core.exportVariable('ORG_NAME_SLUG', orgNameSlug)

  // Download the orgImage
  const supportedFormats = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp',
  }
  let imageExtension
  try {
    const res = await fetch(orgImage)

    const contentType = res.headers.get('content-type')
    imageExtension = supportedFormats[contentType]
    if (!imageExtension) throw new Error(`Unsupported image format. Found content-type: ${contentType}`)
    core.exportVariable('IMAGE_EXT', imageExtension)
    const buffer = await res.arrayBuffer()

    // Remove all image files from that org
    fs.readdirSync('public/organizations')
      .filter(file => file.startsWith(`${orgNameSlug}.`))
      .forEach(file => fs.unlinkSync(`public/organizations/${file}`))

    fs.writeFileSync(`public/organizations/${orgNameSlug}.${imageExtension}`, Buffer.from(buffer))
  } catch (error) {
    console.log(error)
    await github.rest.issues.createComment({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: `Failed to resolve the image. You need to provide a valid image URL with a supported format (jpg, png, svg, webp). Please open a new PR with the correct image.`,
    })
    await github.rest.issues.update({
      issue_number: context.issue.number,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: context.payload.issue.labels.map(label => label.name).concat(['invalid']),
      state: 'closed',
    })
    return false
  }

  // Update the users.json file
  const usersPath = path.join(__dirname, '../../../data/users.json')
  const users = JSON.parse(fs.readFileSync(usersPath)) // Load the users

  let user = {
    updatedAt: new Date().toISOString(),
    name: orgName,
    logoSrc: `/organizations/${orgNameSlug}.${imageExtension}`,
    url: orgUrl,
    phase: orgPhase,
  }
  if (orgUserCount) user.userCount = orgUserCount
  if (orgEnrolledUserCount) user.enrolledUserCount = orgEnrolledUserCount
  if (orgTokens) user.tokenTypes = orgTokens.split(',').map(token => token.trim())

  // Check if org with name already exists. If it does, update the existing org, else add the new org
  const existingOrgIndex = users.findIndex(user => user.name === orgName)
  if (existingOrgIndex !== -1) {
    users[existingOrgIndex] = user
  } else {
    users.push(user)
  }

  // Write the updated users.json file
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))
  return true
}