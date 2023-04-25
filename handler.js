const fetch = require('node-fetch');
const FormData = require('form-data');

const fetchStyles = require('./src/fetchStyles');
const getCritical = require('./src/getCritical');
const minify = require('./src/minify');

exports.handler = async function(event, context) {
  console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  console.warn("Event not processed.")
  return context.logStreamName
}

module.exports.processor = async ({
    url,
    key,
    styles,
    hash,
    return_url: returnURL,
    secret,
}) => {
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
