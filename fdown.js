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
    // 
let SLDown = (req, res, iv) => {
    try {
        const $ = cheerio.load(iv);
        const thumb = $('#trackThumbnail').attr('src').replace(/-large\.png/g, '-t500x500.png');
        const track = $('#trackLink').attr('href');

        res.json({ thumbnail: thumb, track })
    } catch (e) {
        console.log(e)
        req.destroy()
    }
};
let TkDown = async(req, res, iv) => {
    try {
        if (iv) {
            let getStream = async(v) => {
                try {
                    let ux = await fetch(v)
                    let ty = await ux.arrayBuffer()
                    let buf = Buffer.from(ty)
                    return buf
                } catch (e) {
                    console.log(e)
                    return null
                }
            }
            res.send(iv.payload.flatMap(async v => {
                return { link: v.path, type: v.type, stream: await getStream(v.path) }
            }))
        } else {
            req.destroy()
        }
    } catch (e) {
        console.log(e)
        req.destroy()
    }
};
let SPDown = (req, res, iv) => {
    try {
        if (iv) {
            iv.music = iv.link;
            delete iv.link;
            delete iv.success;
            // 
            iv.metadata.thumbnail = iv.metadata.cover;
            delete iv.metadata.cover;
            // 
            let d = iv.metadata
            delete iv.metadata
                // 
            let obj = {...iv, ...d }
            res.send(obj)
        } else {
            req.destroy()
        }
    } catch (e) {
        console.log(e)
        req.destroy()
    }
};
// 
let Ydown = (req, res, iv, id) => {
    try {
        res.json({ thumbnail: `https://i.ytimg.com/vi/${id}/0.jpg`, video: iv })
    } catch (e) {
        console.log(e)
        req.destroy()
    }
}

module.exports = { Fdown, Ydown, SLDown, TkDown, SPDown }