const express    = require('express')
const app        = express()
const bodyParser = require('body-parser')
const jwt        = require('jsonwebtoken')

const secretkey  = 'MySuperSecretKey'
const mongoose   = require('mongoose')
mongoose.connect('mongodb://root:123@ds113700.mlab.com:13700/blog', function (err) {
  if (err) {
    console.error('error!' + err);
  }
})

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Bodyparser to read json post data
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json());

// Load mongodb model schema
const Post = require('./model/Post')
const User = require('./model/User')

// Definindo rotas
const router = express.Router();
//app.use('/', express.static(__dirname + '/'));

// Middleware: run in all requests
router.use(function(req, res, next) {
  console.warn(req.method + " " + 
    req.url + " with " + JSON.stringify(req.body))
  next()
})

// Middleware: auth
const auth = function(req, res, next) {
  
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {
    jwt.verify(token, secretkey, function(err, decoded) {
      if (err) {
        return res.status(403).send({
          success: false,
          message: 'Access denied'
        });
      } else {
        req.decoded = decoded;
        next()
      }
    });
  } else {
    return res.status(403).send({
      success: false,
      message: 'Access denied'
    })
  }
}

// Simple GET / test
router.get('/hello', function(req, res) {
  res.json({message: 'Hello World!'});
});

/*app.get('/hello', function (req, res) {
  res.json({message: 'Hello World'})
})*/

// Users route
router.route('/users')
.get(auth, function (req, res){
  User.find(function (err, users){
    if (err) res.send(err);
    res.json(users);
  })
})
.post(function (req, res) {
  var user = new User();
  user.name = req.body.name;
  user.login = req.body.login;
  user.password = req.body.password;

  // Validação simples
  if (user.login == null) {
    res.status(400).send('Login não pode ser nulo');
    return;
  } else if (user.password == null) {
    res.status(400).send('Password não pode ser nulo');
    return;
  }

  user.save(function(err) {
    if (err) {
      res.send(err);
      return;
    }
    res.json(user);
  });
});

// Login route
router.route('/login')
.post(function (req, res) {

  User.findOne({
    login: req.body.login,
    password: req.body.password
  }, 'name')
  .exec(function (err, user) {

    if (err) {
      res.status(500).send(err);
      return;
    }

    if (user != null) {

      // Criado um objeto pois a formatação do original não funcionava
      var newUser = {
        _id: user._id,
        name: user.name
      };

      var token = jwt.sign(
        newUser, 
        secretkey,
        {expiresIn: '1 day'}
      );

      res.json({user: newUser, token: token});

    } else {

      res.status(400).send('Login/Senha incorretos');
      return;
    }

  });

});

// Posts route
router.route('/posts/:post_id?')
.get(function(req, res){
  Post
  .find()
  .sort([['date', 'descending']])
  .populate('user', 'name')
  .exec(function (err, posts){
    console.log(posts)
    if (err) res.send(err);
    res.json(posts);
  });
})
.post(auth, function (req, res) {
  var post = new Post();
  post.title = req.body.title;
  post.text  = req.body.text;
  post.user  = req.body.user._id;

  if (post.title == null) {
    res.status(400).send('Título não pode ser nulo');
    return;
  }

  post.save(function (err) {
    if (err) {
      res.send(err);
      return;
    }
    res.json(post);
  });

})
.delete(auth, function (req, res) {
  
  Post.remove({
    _id: req.params.post_id
  }, function (err, post) {
    
    if (err) {
      res.send(err)
      return;
    }

    res.json({
      message: 'Successfully deleted'
    })

  })
});

// Register router for use
app.use('/api', router);

module.exports = app