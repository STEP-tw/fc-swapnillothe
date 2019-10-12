const fs = require('fs');
const createTable = require('./commentTable.js');
const parseComments = require('./commentData.js');
const sendFile = require('../util/filePath.js');
const PORT = process.env.PORT || 8080;
const formsTemplate = require('../public/formsTemplate');
const express = require("express");
const app = express();

const loggedInUsers = [];
const loadedData = {};

const readHtmlTemplate = function () {
  loadedData.guestBookTemplate = fs.readFileSync('./public/guestBook.html', 'utf8');
};

const handleRequest = function (req, res) {
  sendFile(req, res);
};

const getLocalTime = function (data) {
  data.map(dataPart => {
    dataPart.date = (new Date(dataPart.date)).toLocaleString();
  });
  return data;
};

const getLoginPage = function () {
  const logInPage = formsTemplate.logInForm();
  return loadedData.guestBookTemplate.replace('_FORM_', logInPage);
};

const getCommentPage = function (name) {
  const commentPage = formsTemplate.commentForm(name);
  return loadedData.guestBookTemplate.replace('_FORM_', commentPage);
};

const isUserLoggedIn = function (req, res) {
  const cookie = req.headers.cookie;
  if (cookie) {
    return true;
  }
  loggedInUsers.push(cookie);
  return false;
};


const handleLogIn = function (req, res) {
  res.statusCode = 302;
  res.setHeader('Set-Cookie', `${req.body}`);
  res.setHeader('location', '/guest-book');
  res.end();
};

const getUserName = function(req){
  return req.headers.cookie.split("=")[1];
};

const serveGuestBook = function (req, res) {
  let guestBook = getLoginPage();
  if (isUserLoggedIn(req, res)) {
    const commentor = getUserName(req);
    guestBook = getCommentPage(commentor);
  }
  res.write(guestBook);
  res.end();
};

const handleLogOut = function (req, res) {
  res.setHeader('Set-Cookie', 'name=deleted; expires=Thu, 18 Dec 2013 12:00:00 UTC');
  res.statusCode = 302;
  res.setHeader('location', '/guest-book');
  res.end();
};

const logRequest = function (req, res, next) {
  console.log(req.method, req.url);
  next();
};

const refreshComments = function (req, res) {
  fs.readFile('./public/commentsData.json', "UTF8", (err, content) => {
    const commentsData = JSON.parse(content);
    getLocalTime(commentsData);
    const commentsHtml = createTable(commentsData);
    res.send(commentsHtml);
  });
};

const writeComments = function (req, res) {
  let commentsToAdd = req.body;
  const commentsFilePath = './public/commentsData.json';
  fs.readFile(commentsFilePath, (err, content) => {
    const commentsData = JSON.parse(content);
    const parsedComment = parseComments(commentsToAdd);
    parsedComment.name = getUserName(req);
    commentsData.unshift(parsedComment);
    fs.writeFile(commentsFilePath, JSON.stringify(commentsData), 'utf8', () => {
      serveGuestBook(req, res);
    });
  });
};

const readPostData = function (req, res, next) {
  let postedData = '';
  req.on('data', (chunk) => {
    postedData = postedData + chunk;
  });
  req.on('end', () => {
    req.body = postedData;
    next();
  });
};



app.use(logRequest);
app.use(readPostData);

app.post('/guest-book', writeComments);
app.get('/guest-book', serveGuestBook);
app.get('/comments', refreshComments);
app.post('/login', handleLogIn);
app.post('/logout', handleLogOut);
app.use(handleRequest);
readHtmlTemplate();

app.listen(PORT,()=>{
  console.log(`server is listening on ${PORT}`);
});
