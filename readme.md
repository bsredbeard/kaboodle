Kaboodle
---
Run NPM scripts when your files change, without configuring another build system.

## How to use

1. Install globally with `npm install -g kaboodle` or install in your project with `npm install --save kaboodle`
2. Modify your `package.json` to add the following:
```JSON
{
  "kaboodle": {
    "watch": {
      "{a_npm_script_name}": "your/glob/pattern/**/*",
      "{a_different_script_name}": [
        "many/globs/*",
        "package.json",
        "app/js/**/*"
      ]
    }
  }
}
```
2. Run `kaboodle` in a console or via an npm script.
3. Exit with ctrl-c to close the watchers and any child processes.

### Notes

* While `package.json` is used in the sample above, Kaboodle does not hot-reload changes to its config section when your `package.json` is modified. You can however watch it to reprocess whenver you update a script registration. ¯\\\_(ツ)\_/¯
* If you have no watch patterns registered to a script it will never get executed.

## What it does

Kaboodle uses chokidar to watch the globs associated with each NPM script. If any matched file is changed, the script is run via a child process. While the script is running, kaboodle ignores any changes matched by the script's globs, preventing you from getting naive, infinite loops of asset processing.

This way you spend less time about lean glob patterns and more time on your actual work.

## License
MIT, see [License](LICENSE)