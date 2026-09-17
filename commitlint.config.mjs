/** Conventional commits enforced by Husky's commit-msg hook and in CI. */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 100],
    // Dependabot writes "chore(deps): Bump …" with a capitalised subject and long URL lines in the body;
    // those commits land on main via rebase, so the rules must accept them.
    "subject-case": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};

export default config;
