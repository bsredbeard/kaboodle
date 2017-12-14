const name = 'kaboodle';

const OS = require('os');
const fs = require('fs');
const exec = require('child_process').exec;

const chokidar = require('chokidar');
const exitHook = require('exit-hook');

const packages = JSON.parse(fs.readFileSync('./package.json', { encoding: 'utf8' }));
const example = `{
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
}`;

const pool = {
  watchers: [],
  addWatcher: (watcher) => {
    pool.watchers.push(watcher);
  },
  removeWatcher: (watcher) => {
    const idx = pool.watchers.indexOf(watcher);
    if(idx >= 0){
      pool.watchers.splice(idx, 1).forEach(w => w.close());
    }
  },
  shutdown: () => {
    pool.watchers.forEach(w => w.close());
    pool.watchers.splice(0, pool.watchers.length);
  }
};

class Watcher{
  constructor(cmd, pattern) {
    this.cmd = cmd;
    this.pattern = pattern;
    this.process = null;
    this.choke = chokidar.watch(pattern);
    this.choke.on('all', this.changed.bind(this));
    pool.addWatcher(this);
  }
  changed(){
    if(this.process == null){
      this.process = exec(`npm run ${this.cmd}`);
      this.process.stdout.on('data', x => console.info(`${this.cmd}>`, x));
      this.process.stderr.on('data', x => console.error(`${this.cmd}>`, x));
      this.process.on('error', (err) => {
        console.error(`kaboodle: script ${this.cmd} threw the following error:${OS.EOL}${err}`);
        if(!this.process.killed){
          this.process.kill();
        }
        this.process = null;
        close();
      });
      this.process.on('close', code => {
        if(code){
          console.error(`${this.cmd}> exited with code ${code}`);
          this.close();
        }
        this.process = null;
      });
    }
  }
  close(){
    if(this.choke){
      if(this.process != null){
        if(!this.process.killed){
          this.process.kill();
        }
        this.process = null;
      }
      this.choke.close();
      this.choke = null;
      pool.removeWatcher(this);
    }
  }
}

const watchCommands = packages.kaboodle && packages.kaboodle.watch ? Object.keys(packages.kaboodle.watch) : [];

if(watchCommands.length){
  watchCommands.forEach(cmd => new Watcher(cmd, packages.kaboodle.watch[cmd]));
  
  const intervalId = setInterval(() => {}, 5000);

  exitHook(() => {
    pool.shutdown();
    clearInterval(intervalId);
    console.info('kaboodle: shutdown complete');
  });
} else {
  console.warn(`There are no commands to watch.${OS.EOL}Configure package.json/kaboodle/watch with commands and their watched glob pattern(s).${OS.EOL}Example:${OS.EOL}${example}`);
}
