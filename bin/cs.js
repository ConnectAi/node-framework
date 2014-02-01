#!/usr/bin/env node

var fs = require("fs"),
	path = require("path"),
	npm = require("npm"),
	program = require("commander"),
	request = require("request")
;

var urls = {
	raw: "https://raw.github.com/ConnectAi/cornerstone-skeleton/dev/master/",
	tree: "https://api.github.com/repos/connectai/cornerstone-skeleton/git/trees/dev%2Fmaster?recursive=1"
};

var getEnd = function(p) {
	return p.split("/").pop();
};

program
	.version(require("../package").version)
;

program.command("init [name] [path]")
	.description("Create an empty cornerstone project or reinitialize an existing one.")
	.option("-b, --bare", "bare project")
	.action(function(name, directory, options) {
		// If a directory was given but no name, swap variables.
		if (name && !directory && /[.\/]/.test(name)) {
			directory = name;
			name = getEnd(path.resolve(directory));
		}

		if (!name && !directory) {
			// If no name nor directory were given, default to the current directory.
			name = getEnd(process.cwd());
			directory = process.cwd().split("/").slice(0, -1).join("/");
		} else if (name && !directory) {
			// If a name was given but no directory, default to the name.
			directory = name;
		} else if (!name && directory) {
			// If a directory was given but no name, default to the directory.
			name = path.normalize(directory);
		}
		// Make directory an absolute path.
		directory = path.resolve(directory);

		// Be like `mv` and `copy` in that behavior is based on whether the directory exists.
		if (getEnd(directory) !== name && fs.existsSync(directory)) directory = path.join(directory, name);
		// Make the directory if it does not exist.
		if (!fs.existsSync(directory)) fs.mkdirSync(directory);

		if (options.bare) {
			console.log("bare project");
		} else {
			request.get({
				url: urls.tree,
				json: true,
				headers: {
					"User-Agent": "request"
				}
			}, function(err, res, body) {
				var dirs, files;
				if (!err && res.statusCode == 200) {
					// Split files from git into folders (tree) and files (blob).
					var nodes = body.tree.reduce(function(nodes, branch) {
						if (!(branch.type in nodes)) nodes[branch.type] = [];
						nodes[branch.type].push(branch.path);
						return nodes;
					}, {});

					// First make each directory.
					nodes.tree.forEach(function(dir) {
						var where = directory + "/" + dir;
						if (!fs.existsSync(where)) {
							fs.mkdirSync(where);
							console.log("Writing", where);
						} else {
							console.log("Skipping", where);
						}
					});

					// Then save each file.
					nodes.blob.forEach(function(file) {
						var where = directory + "/" + file;
						if (!fs.existsSync(where)) {
							var writer = fs.createWriteStream(where);
							request(urls.raw + file).pipe(writer);

							if (name && file === "config.json") {
								writer.on("finish", function() {
									var config = require(where);
									config.name = name;
									fs.writeFile(where, JSON.stringify(config, null, "\t"));
								});
							}
							console.log("Writing", where);
						} else {
							console.log("Skipping", where);
						}
					});
				}
			});
		}
	})
;

program.parse(process.argv)
