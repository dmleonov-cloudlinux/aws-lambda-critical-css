const fetch = require('node-fetch');
const FormData = require('form-data');

const fetchStyles = require('./src/fetchStyles');
const getCritical = require('./src/getCritical');
const minify = require('./src/minify');

module.exports.processor = async (event) => {
    const body = JSON.parse(event.body);
    const url = body.url;
    const key = body.key;
    const styles = body.styles;
    const hash = body.hash;
    const return_url = body.returnURL;
    const secret = body.secret;

    const stylesheets = await fetchStyles(styles);
    const critical = await getCritical(url, stylesheets);
    const minified = minify(critical);
    const body = new FormData();
    const data = {
        key,
        hash,
        stylesheet: minified,
        secret,
        url,
    };

    Object.keys(data)
        .forEach(key => {
            try {
                body.append(key, data[key]);
            } catch {}
        });

    const response = await fetch(returnURL, {
        method: 'POST',
        body,
        insecureHTTPParser: true,
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
        return response.status;
    }

    return response.json();
};
