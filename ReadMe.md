# What is GitWiki?

GitWiki is a low-level wiki module for nodejs.

GitWiki uses git as file storage system. To access git repository
this module uses [node-gitteh](https://github.com/libgit2/node-gitteh).

# What you mean by "low-level"?

By low-level I mean the functions are designed to build a wiki on top
of them (e.g Editing a file cause a new commit so one can track file
changes).Also the goal is to provide functions to build a wiki site
faster, you can use this module for other purposes. For example
you can use it to build an online repository manager.

# Attention:
 
This module needs gitteh v0.0.4
Due to a bug in gitteh, removing tree entries in git repository by 
their names is not possible. You should download and install my fork 
of gitteh library to use gitwiki.
