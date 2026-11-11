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

const updateNameHeading = "Organization Name to Update";
const removeNameHeading = "Organization Name to Remove";
const clearTokenTypes = "Clear token types";

const removeUnusedLogo = (logoSrc, users) => {
  if (
    /^\/organizations\/[^/]+\.[^/]+$/.test(logoSrc ?? "") &&
    !users.some((user) => user.logoSrc === logoSrc)
  ) {
    fs.rmSync(`public${logoSrc}`, { force: true });
  }
};

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
  const fields = new Map();
  for (let index = 1; index < sections.length; index += 2) {
    const value = sections[index + 1].trim();
    fields.set(sections[index], value === "_No response_" ? "" : value);
  }
  const getField = (heading) => fields.get(heading) ?? "";
  const isUpdate = fields.has(updateNameHeading);
  const isRemoval = fields.has(removeNameHeading);
  if (isUpdate && isRemoval) {
    return invalidSubmission("Use a single organization form per issue.");
  }

  const nameHeading = isRemoval
    ? removeNameHeading
    : isUpdate
      ? updateNameHeading
      : "Organization Name";
  const listedName = getField(nameHeading);
  if (!listedName || /[\r\n]/.test(listedName)) {
    return invalidSubmission(`Enter ${nameHeading} on a single line.`);
  }

  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  const existingIndex = users.findIndex((user) => user.name === listedName);
  const existing = users[existingIndex];
  if ((isUpdate || isRemoval) && !existing) {
    return invalidSubmission(
      "Copy the exact organization name from the published listing.",
    );
  }

  let name = listedName;
  let newLogo;
  if (isRemoval) {
    users.splice(existingIndex, 1);
  } else {
    name = (isUpdate && getField("New Organization Name")) || listedName;
    const orgNameSlug = slugify(name, { lower: true });
    if (!orgNameSlug || /[\r\n]/.test(name)) {
      return invalidSubmission(
        "Enter a valid organization name on a single line.",
      );
    }
    if (name !== listedName && users.some((user) => user.name === name)) {
      return invalidSubmission("The new organization name is already listed.");
    }

    const orgUrl = getField("Organization URL");
    if (
      (orgUrl || !isUpdate) &&
      (!URL.canParse(orgUrl) || new URL(orgUrl).protocol !== "https:")
    ) {
      return invalidSubmission(
        "Enter a valid Organization URL starting with https://.",
      );
    }

    const orgPhase = getField("Implementation Phase");
    if (
      (orgPhase || !isUpdate) &&
      !["Evaluation", "Testing", "Production"].includes(orgPhase)
    ) {
      return invalidSubmission(
        "Set Implementation Phase to Evaluation, Testing, or Production.",
      );
    }

    const user = isUpdate ? { ...existing, name } : { name };
    if (orgUrl) {
      user.url = orgUrl;
      delete user.link;
    }
    if (orgPhase) user.phase = orgPhase;

    for (const [heading, key] of [
      ["Approximate user count", "userCount"],
      ["Approximate eduMFA enrolled users", "enrolledUserCount"],
    ]) {
      const count = getField(heading);
      if (!count) continue;
      if (isUpdate && count.toLowerCase() === "clear") {
        delete user[key];
      } else {
        const value = Number(count);
        if (!Number.isSafeInteger(value) || value < 0) {
          return invalidSubmission(
            `Enter a non-negative whole number for ${heading}.`,
          );
        }
        user[key] = value;
      }
    }

    const orgTokens = getField("Token Types");
    if (orgTokens) {
      if (isUpdate && orgTokens === clearTokenTypes) {
        delete user.tokenTypes;
      } else {
        const tokenTypes = orgTokens.split(",").map((token) => token.trim());
        if (
          tokenTypes.some((token) => !organizationTokenTypes.includes(token))
        ) {
          return invalidSubmission(
            isUpdate
              ? "Enter supported values in Token Types. Select Clear token types on its own to remove the list."
              : "Enter supported values in Token Types or leave it blank.",
          );
        }
        user.tokenTypes = tokenTypes;
      }
    }

    const imageField = getField("Organization Image");
    if (imageField || !isUpdate) {
      const imageUrl =
        imageField.match(/!\[[^\]]*\]\(([^)]+)\)/)?.[1] ??
        imageField.match(/\bsrc=["']?([^"'\s>]+)/)?.[1] ??
        imageField;
      try {
        const response = await fetch(imageUrl);
        const imageExtension = supportedFormats.get(
          response.headers.get("content-type"),
        );
        if (!response.ok || !imageExtension) {
          throw new Error("Image unavailable or unsupported format");
        }
        newLogo = {
          src: `/organizations/${orgNameSlug}.${imageExtension}`,
          data: Buffer.from(await response.arrayBuffer()),
        };
      } catch {
        return invalidSubmission(
          "Provide a working Organization Image link in JPG, PNG, SVG, or WebP format.",
        );
      }

      user.logoSrc = newLogo.src;
      if (
        users.some(
          (entry, index) =>
            index !== existingIndex && entry.logoSrc === user.logoSrc,
        )
      ) {
        return invalidSubmission(
          "The new image filename is already used by another organization.",
        );
      }
    }

    if (
      isUpdate &&
      !newLogo &&
      JSON.stringify(user) === JSON.stringify(existing)
    ) {
      return invalidSubmission(
        "Enter at least one change to the published listing.",
      );
    }
    user.updatedAt = new Date().toISOString();
    if (existing) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
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
      const existing = data.find(
        (pr) =>
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

  if (newLogo) {
    fs.writeFileSync(`public${newLogo.src}`, newLogo.data);
  }
  removeUnusedLogo(existing?.logoSrc, users);
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  if (hasLabel("invalid")) {
    await github.rest.issues.removeLabel({ ...issueParams, name: "invalid" });
  }

  core.setOutput("branch", branch);
  core.setOutput("name", name);
  core.setOutput(
    "operation",
    isRemoval ? "Remove" : existing ? "Update" : "Add",
  );
  return true;
};

export default createOrganizationPr;
