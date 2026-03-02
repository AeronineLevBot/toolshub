// api/callback.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) return res.status(400).send('Code manquant');

  try {
    const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.REDIRECT_URI,
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = response.data;
    // Redirige vers ton dashboard avec le token
    res.redirect(`/dashboard.html?token=${access_token}`);
  } catch (err) {
    console.error(err.response?.data);
    res.status(500).send('Erreur OAuth');
  }
});

module.exports = router;