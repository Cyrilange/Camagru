router.get('/verify', async (req, res) => {
	const { token } = req.query;
  
	try {
	  return res.redirect('/verified.html');
  
	} catch (err) {

	  return res.status(400).send("Le lien de vérification est invalide ou a expiré.");
	}
  });