const { Router } = require('express');

const router = Router();

router.get('/', (req, res) => {
  res.render('user-auth/home', { title: 'RescueNow — Emergency Response' });
});

router.get('/login', (req, res) => {
  res.render('user-auth/login', { title: 'RescueNow | Sign In' });
});

router.get('/register', (req, res) => {
  res.render('user-auth/register', { title: 'RescueNow | Create Account' });
});

router.get('/dashboard', (req, res) => {
  res.render('user-auth/dashboard', { title: 'RescueNow | Dashboard' });
});

module.exports = router;
