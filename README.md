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

To configure the default options for all future requests, use the `setDefault` function:
```javascript
import {setDefaults} from 'ftchr';

setDefaults({
  credentials: 'include'
  headers: {
    Accept: 'text/html',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});
```
**Note: the defaults out of the box are as follows:***
```javascript
{
  credentials: 'same-origin',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
}
```

### Response Handling

If the response content-type is `application/json` and the status is anything but `204: No Content`, the response will be automatically parsed.
An exception will be thrown if the status code is greater than or equal to `400`, with a message set to that returned from the server.
**Note: the server must return an object containing a `message` key with the corresponding error as the value**

If the value returned from the server is not an object, it will be added to the response with the key `contents`.

**Note: The original response from `fetch` will always be accessible with the key `_res`.**

## Licence

[MIT](./LICENSE)
