import fs from "node:fs";
import slugify from "slugify";
import { organizationTokenTypes } from "../../../src/types/organizationTokenTypes.js";

const usersPath = new URL("../../../src/data/users.json", import.meta.url);
const supportedFormats = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/svg+xml", "svg"],
  ["image/webp", "webp"],
]);

const createOrganizationPr = async ({ github, context, core }) => {
  const issueParams = { ...context.repo, issue_number: context.issue.number };
  const { data: issue } = await github.rest.issues.get(issueParams);
  const hasLabel = (name) => issue.labels.some((label) => label.name === name);

  if (
    issue.state !== "open" ||
    !hasLabel("organization") ||
    issue.body !== context.payload.issue.body
  ) {
    return false;
  }

  const invalidSubmission = async (message) => {
    await github.rest.issues.addLabels({ ...issueParams, labels: ["invalid"] });
    await github.rest.issues.createComment({
      ...issueParams,
      body: `${message} Edit the fields in the body of this issue and save it to try again.`,
    });
    return false;
  };

  const sections = (issue.body ?? "").split(/^### ([^\r\n]+?)[ \t]*\r?$/m);
  const getField = (heading) => {
    const index = sections.indexOf(heading);
    const value = index > 0 ? sections[index + 1].trim() : "";
    return value === "_No response_" ? "" : value;
  };

  const orgName = getField("Organization Name");
  const orgNameSlug = slugify(orgName, { lower: true });
  const orgUrl = getField("Organization URL");
  const orgImageField = getField("Organization Image");
  const orgImage =
    orgImageField.match(/!\[[^\]]*\]\(([^)]+)\)/)?.[1] ??
    orgImageField.match(/\bsrc=["']?([^"'\s>]+)/)?.[1] ??
    orgImageField;
  const orgPhase = getField("Implementation Phase");
  const orgUserCount = getField("Approximate user count");
  const orgEnrolledUserCount = getField("Approximate eduMFA enrolled users");
  const orgTokens = getField("Token Types");
  const tokenTypes = orgTokens ? orgTokens.split(",").map((token) => token.trim()) : [];

  if (!orgNameSlug || /[\r\n]/.test(orgName)) {
    return invalidSubmission("Enter an Organization Name on a single line.");
  }

  if (!URL.canParse(orgUrl) || new URL(orgUrl).protocol !== "https:") {
    return invalidSubmission("Enter a valid Organization URL starting with https://.");
  }

  if (!["Evaluation", "Testing", "Production"].includes(orgPhase)) {
    return invalidSubmission("Set Implementation Phase to Evaluation, Testing, or Production.");
  }

  if (isNaN(orgUserCount) || isNaN(orgEnrolledUserCount)) {
    return invalidSubmission("Enter a valid number for each user count or leave it blank.");
  }

  if (tokenTypes.some((token) => !organizationTokenTypes.includes(token))) {
    return invalidSubmission("Enter supported values in Token Types or leave it blank.");
  }

  let imageExtension;
  let imageBuffer;
  try {
    const response = await fetch(orgImage);
    imageExtension = supportedFormats.get(response.headers.get("content-type"));
    if (!response.ok || !imageExtension) {
      throw new Error("Image unavailable or unsupported format");
    }
    imageBuffer = Buffer.from(await response.arrayBuffer());
  } catch {
    return invalidSubmission("Provide a working Organization Image link in JPG, PNG, SVG, or WebP format.");
  }

  // Reuse the branch of an open PR created before branches were named by issue number.
  let branch = `organization-issue/${issue.number}`;
  if (context.payload.action === "edited") {
    const pullRequests = github.paginate.iterator(github.rest.pulls.list, {
      ...context.repo,
      state: "open",
      base: context.payload.repository.default_branch,
      per_page: 100,
    });
    for await (const { data } of pullRequests) {
      const existing = data.find((pr) =>
        pr.user?.login === "github-actions[bot]" &&
        pr.head.repo?.id === context.payload.repository.id &&
        pr.head.ref.startsWith("organization/") &&
        pr.body?.trimEnd().endsWith(`\nCloses #${issue.number}`),
      );
      if (existing) {
        branch = existing.head.ref;
        break;
      }
    }
  }

  for (const file of fs.readdirSync("public/organizations")) {
    if (file.startsWith(`${orgNameSlug}.`)) {
      fs.unlinkSync(`public/organizations/${file}`);
    }
  }

  const logoSrc = `/organizations/${orgNameSlug}.${imageExtension}`;
  fs.writeFileSync(`public${logoSrc}`, imageBuffer);

  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  const user = {
    updatedAt: new Date().toISOString(),
    name: orgName,
    logoSrc,
    url: orgUrl,
    phase: orgPhase,
  };
  if (orgUserCount) user.userCount = parseInt(orgUserCount);
  if (orgEnrolledUserCount) user.enrolledUserCount = parseInt(orgEnrolledUserCount);
  if (tokenTypes.length) user.tokenTypes = tokenTypes;

  const existingOrgIndex = users.findIndex((user) => user.name === orgName);
  if (existingOrgIndex !== -1) {
    users[existingOrgIndex] = user;
  } else {
    users.push(user);
  }

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  if (hasLabel("invalid")) {
    await github.rest.issues.removeLabel({ ...issueParams, name: "invalid" });
  }

  core.setOutput("branch", branch);
  core.setOutput("name", orgName);
  return true;
};

export default createOrganizationPr;
