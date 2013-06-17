// http://traceur-compiler.googlecode.com/git/demo/repl.html

var defaultHandler = function(route) {
	return function(req, res) {
		res.render(route);
	};
};

class Controller {
	constructor(name, routes) {
		this.name = name;
		this.buildRoutes(routes);
	}

	buildRoutes(routes) {
		for (var route in routes) {
			var handler = routes[route];
			var url = route.match(/^(?:(get|post|put|delete)\s+)?\/?([\w\-]+)$/);

			if (url){
				var verb = url[1] || "get";
				var action = url[2];
				var path = this.name + "/" + action;

				var isEmpty = /^[^{]+\{\s*\}$/.test(""+handler);
				if (isEmpty) {
					handler = defaultHandler(path);
				}

				app[verb]("/" + path, handler);
			}
		}
	}
}

module.exports = Controller;
