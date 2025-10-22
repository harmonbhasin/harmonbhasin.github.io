---
title: Life in the terminal can be enjoyable
description: Customizations and tools I use in the terminal.
date: '2025-10-22'
categories:
  - engineering
published: true
---

I live in my terminal. Remote servers are what got me here, but I now use it locally by choice — it's functional and enjoyable. With a bit of customization and better tooling, you can enjoy it too. Here's what worked for me.

*Inspired by similar posts by [Simon Boehm](https://siboehm.com/articles/22/tools-i-like) and [Eugene Yan](https://eugeneyan.com/writing/mac-setup/).*

## Customization

Aliasing frequently used commands is the fastest way to make the terminal more functional. Start simple by aliasing common commands. I've aliased `l` to be `ls -lah` for readability. Beyond shortcuts, aliases can encode workflow patterns. I use this function (from [Abin Simon's blog](https://blog.meain.io/2023/navigating-around-in-shell/)) that jumps to git project root from anywhere in the repo:

```bash
r () {
cd "$(git rev-parse --show-toplevel 2>/dev/null)"
}
```

For more complex customization (e.g. text editor or interactive shell), start by gradually changing config files as opposed to using pre-built configurations online. These online configurations often make tools slower, add unknown dependencies, and impede the ability to learn the tool.

Storing config files in a git repository, known as a [dotfiles](https://missing.csail.mit.edu/2019/dotfiles/) repo, allows reproducible customizations across machines. When on a new machine, I clone [my dotfiles repo](https://github.com/harmonbhasin/dotfiles.git) then symbolically link my config files to their appropriate locations (usually `$HOME`). Any updates to tooling are committed to the repo, allowing persistence in customization across machines.

Making dedicated repos to download and setup tooling can also make life easier. For example, I have a rough setup script for [EC2 instances](https://github.com/harmonbhasin/nao-ec2-setup.git), and a better setup script for using [GPU instances](https://github.com/harmonbhasin/gpu-setup.git) on Runpod.

## Recommendations

Below are tools or replacements for existing tools that I use frequently in no particular order.

- zsh/bash/fish (interactive shell): Worth customizing whichever you use. Customize via your rc file ([primer here](https://scriptingosx.com/2017/04/about-bash_profile-and-bashrc-on-macos/)). Some of my customizations: infinite history, aliases, autocompletion, custom prompt, and vi mode in .inputrc.
- ghostty (terminal emulator): Replaces iTerm2/Terminal.
- delta (differ): Replaces diff. Update git diffing to use delta via .gitconfig [^1].
- fzf (fuzzy finder): Find any file from current directory (Ctrl+t), better UI for shell history searching (Ctrl+r).
- rg (text search): Replaces grep. Faster with better defaults.
- zoxide (directory navigation): Replaces cd. Remembers directories you've been in so you don't have to type out whole paths.
- claude code (coding agent): Daily driver for coding. Here are [a](https://x.com/swyx/status/1954720792962642401) [few](https://github.com/humanlayer/advanced-context-engineering-for-coding-agents/blob/main/ace-fca.md) [links](https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it) that explain how I like using the tool.
- neovim (text editor): Works the same locally and remotely. LSPs and treesitters provide IDE features. For AI tooling (the main draw of Cursor/Zed), use packages like avante.nvim, codecompanion.nvim, or codeium.nvim - I use Claude Code instead. I use it for code and notes. Learn vim keybindings — they speed up navigation significantly.
- tmux (terminal multiplexer): Replaces screen. Necessary for keeping processes running on remote servers. I also use it locally because it makes mouse-free text copying easy, and Claude Code can read from any pane. I keep a [floating pane](https://github.com/harmonbhasin/dotfiles/blob/1f40ec2d55634c06e6d0156bd87d0f312777c069/tmux/.tmux.conf#L13) with a persistent Claude Code instance.
- tldr (command documentation): Replaces man. Gives common examples rather than walls of text. I still use man, but default to tldr first.
- uv (python package and project manager): Replaces conda [^2]/virtualenv. I use this when possible.
- ruff/mypy (python linter and code formatter/static type checker): Settings live in the same pyproject.toml used by uv. Claude Code can call both

[^1]: I also recommend customizing your .gitconfig.
[^2]: This won't always work. For example, I don't think biopython has uv support yet.

Don't cargo-cult this list. The terminal becomes enjoyable when it fits your workflow, not mine.

