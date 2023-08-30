const fetch = require('node-fetch');
const FormData = require('form-data');

const fetchStyles = require('./src/fetchStyles');
const getCritical = require('./src/getCritical');
const minify = require('./src/minify');

module.exports.processor = async (event) => {
    if (process.env.X_API_KEY !== event.headers['x-api-key']) {
        throw new Error("Unauthorized access");
    }

    const ipAddress = event.requestContext.http.sourceIp;
    const ipList = process.env.IP_WHITE_LIST.split(",");
    if (!ipList.includes(ipAddress)) {
        throw new Error("Unauthorized access");
    }

    const eventBody = JSON.parse(event.body);

    const url = eventBody.url;
    const key = eventBody.key;
    const styles = eventBody.styles;
    const hash = eventBody.hash;
    const returnURL = eventBody.return_url;
    const secret = eventBody.secret;

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
