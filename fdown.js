const cheerio = require('cheerio')
    // 
let Fdown = (req, res, iv) => {
    try {
        const $ = cheerio.load(iv);
        const thumb = $('.image-fb img').attr('src');
        const video = $('#vid').attr('src');

        res.json({ thumbnail: thumb, video })
    } catch (e) {
        console.log(e)
        req.destroy()
    }
}

module.exports = Fdown