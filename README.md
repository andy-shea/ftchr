# ftchr

[![Build Status](https://travis-ci.org/andy-shea/ftchr.svg?branch=master)](https://travis-ci.org/andy-shea/ftchr)
[![Code Coverage](http://codecov.io/github/andy-shea/ftchr/coverage.svg?branch=master)](http://codecov.io/github/andy-shea/ftchr?branch=master)

A wrapper around fetch for a nicer API

## Install

```yarn add ftchr```

## Usage

GET, POST, PUT, and DELETE requests are made using the correspondingly named function:
```javascript
import {get, post, put, del} from 'ftchr';

post('/api/foo') // posts to '/api/foo'
get('/api/bar') // get request to '/api/bar'
put('/api/baz') // put request to '/api/baz'
del('/api/qux') // delete request to '/api/qux'
```

### Parameters

When making a GET request, any parameters passed in via the parameters object will be encoded and appended to the URL as a query string:
```javascript
get('/api/foo', {page: 2, limit: 10}) // get request to '/api/foo?page=2&limit=10'
```

For all other requests, the parameters will be encoded as the body of the request depending on the content-type:
```javascript
// application/json content-type
post('/api/foo', {bar: 'baz', qux: 50}) // posts to '/api/foo' with body '{"bar":"baz","qux":50}'

// application/x-www-form-urlencoded content-type
put('/api/foo', {bar: 'baz', qux: 50}) // put request to '/api/foo' with body 'bar=baz&qux=50'
```
**Note: only `application/json` and `application/x-www-form-urlencoded` content-types are automatically encoded**

### Configuring Requests

The request can be further configured via the `options` argument which is passed directly to the `fetch` call.
For example, to configure the cookie to be sent in a CORS request:
```javascript
post('https://someothersite.com/api/foo', {bar: 'baz'}, {credentials: 'include'})
```

To return a set of fetch functions configured with default options for all future requests, use the `withDefaults` function:
```javascript
import withDefaults from 'ftchr';

const {get, post, put, patch, delete} = withDefaults({
  credentials: 'same-origin',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

post('/test'); // performs post request with same-origin credentials and json accept/content-type
```

### Response Handling

If the response content-type is `application/json` and the status is anything but `204: No Content`, the response body will be automatically parsed and added back to the response with the key `contents`.
For all other content-types the response will be returned as is.

To override the response returned, you can provide a function as the second parameter to `withDefaults` which takes the original response and should return the necessary information as required.
For example, to automatically save any bearer tokens in a cookie after a request:
```javascript
const fetch = withDefaults({}, response => {
  const authorisation = response.headers.get('Authorization');
  if (authorisation) {
    const [type, token] = authorisation.split(' ');
    if (type === 'Bearer') cookies.set('token', token);
  }
  return response;
});
```

## Licence

[MIT](./LICENSE)
