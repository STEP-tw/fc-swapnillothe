const fs = require('fs');

const getFilePath = function (url) {
  if (url == '/') {
    return './src/public/index.html';
  }
  return './src/public' + url;
}

const send = (res, content, statusCode = 200) => {
  res.write(content);
  res.statusCode = statusCode;
  res.end();
}

const showFile = (req, res, filePath) => {
  fs.readFile(filePath, (err, content) => {
    try {
      send(res, content);
    } catch (err) {
      send(res, '404 - The page cannot be found', 404);
    }
    return;
  });
}

const handleRequest = function (req, res) {
  const filePath = getFilePath(req.url);
  showFile(req, res, filePath);
}

const parseArgs = function (args) {
  const parsedArgs = {};
  const argsToParse = args.split('&').map(arg => arg.split('='));
  argsToParse.map(arg => {
    const key = arg[0];
    const value = arg[1].replace(/\+/g, ' ');
    parsedArgs[key] = value;
  });
  const date = new Date().toLocaleString();
  parsedArgs.date = date;
  return parsedArgs;
}

const writeComments = function (req, res) {
  let commentsData = '';
  req.on('data', (chunk) => {
    commentsData = commentsData + chunk;
  });

  req.on('end', () => {
    const commentsFilePath = './src/public/commentsData.json';
    fs.readFile(commentsFilePath, 'utf8', (err, comments) => {
      let commentsJsonData = JSON.parse(comments);
      commentsJsonData.push(parseArgs(commentsData));
      comments = JSON.stringify(commentsJsonData);
      fs.writeFile(commentsFilePath, comments, () => { });
    });
    res.end();
  });
}

const isSameUrl = (route1, route2) => {
  return route1.url == route2.url &&
    route1.method == route2.method;
}

class App {
  constructor() {
    this.routes = [];
  }

  get(url, handler) {
    const route = { url, handler, method: 'GET' };
    this.routes.push(route);
  }

  post(url, handler) {
    const route = { url, handler, method: 'POST' };
    this.routes.push(route);
  }

  handleRequest(req, res) {
    const matchedRoutes = this.routes.filter(
      isSameUrl.bind(null, req)
    );
    if (matchedRoutes.length > 0) {
      matchedRoutes[0].handler(req, res);
    }
  }
}

const app = new App();
app.get('/', handleRequest);
app.get('/main.css', handleRequest);
app.get('/waterJar.js', handleRequest);
app.get('/photos/freshorigins.jpg', handleRequest);
app.get('/photos/animated-flower-image-0021.gif', handleRequest);
app.get('/guestBook.html', handleRequest);
app.post('/guestBook.html', writeComments);
app.get('/commentsData.json', handleRequest);

module.exports = app.handleRequest.bind(app);
