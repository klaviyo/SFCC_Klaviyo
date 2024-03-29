# Contributing

Thank you for investing your time in contributing to our cartridge! Any
contribution you make helps us make this project better. There are a number
of sections that cover various different contribution methods. Make sure to
review the one that's right for your type of contribution.

## Creating an Issue

Found a bug in our cartridge? Raise an issue with the appropriate template and
we'll look into it! Please add any notes that you believe will be helpful to
our team in determining a solution for the issue.

## Raising a Pull Request

After your changes are ready for review, raise a PR with your branch against master!

> ℹ️  If you are releasing a patch for a version on LTS/STS, please branch off
> of the appropriate stable release branch or tag. When your PR is ready for review,
> raise the PR against the stable release branch. If one doesn't exist, ask the
> maintainers to create one.

### Releasing a New Version

Ready to release? Great! This repository has a number of versioned files which are
managed with [Changelogger](https://pypi.org/project/changelogged/); in order to
perform a release, you'll need to run `changelogger upgrade (patch|minor|major)`
(shorthand `cl up`). Once you've added any relevant Changelog notes, make sure
the changes made by changelogger look good. If they do, commit your changes and
push them to your branch.

When this PR is merged into master, the new version will trigger a release.

> ℹ️  This project does not have an automated release pipeline. To perform a full
> release, review the [Internal](INTERNAL.md) documentation.
## Local Environment

### Pre-commit

This repository uses [`pre-commit`](https://pre-commit.com/) to verify changes
before commiting them. Pre-commit will be run for each pull request raised
against release branches, but should also be setup on your local. Follow the
steps to install pre-commit from [their website](https://pre-commit.com/).
Once this is done, run `pre-commit install` from the root of this project.

### Changelogger

Our SFCC cartridge has a number of _versioned_ files (i.e. files that include
versioning data). [Changelogger](https://pypi.org/project/changelogged/) automates
the upgrade for each of these files and manages updates to our changelog. You can
install Changelogger with `pip`: `pip install changelogged`.

> ℹ️  Changelogger requires Python 3.10 or higher.

## Testing

> 🚧 We're currently overhauling our testing capabilities. Thank you for your
> patience while we improve this process.
>
> For internal use: See [TP168875](https://klaviyo.tpondemand.com/entity/168875-spike-sfcc-src-directory-migration-strategy).
>