import testWithProvision from 'tape-pencil';
import proxyquire from 'proxyquire';

function createHeaders(headers) {
  return {
    get(key) {
      return headers[key];
    }
  }
}

function createJson(contents) {
  return () => Promise.resolve(contents);
}

function response(headers, status, url, options) {
  return {
    headers: createHeaders(headers),
    status,
    url,
    options
  };
}

function jsonResponse(headers, contents, status, url, options) {
  return {
    ...response(headers, status, url, options),
    json: createJson(contents)
  };
}

function htmlResponse(headers, contents, status, url, options) {
  return {
    ...response(headers, status, url, options),
    text: () => Promise.resolve(contents)
  };
}

function fetch(contentType, response, status, contents = undefined) {
  return () => [proxyquire('../src', {
    'isomorphic-fetch': (url, options) => {
      return Promise.resolve(response({'Content-Type': contentType}, contents, status, url, options));
    }
  })];
}

const jsonFetch = fetch.bind(undefined, 'application/json', jsonResponse);
const htmlFetch = fetch.bind(undefined, 'text/html', htmlResponse);

function testRequestType(method) {
  const type = (method === 'del') ? 'DELETE' : method.toUpperCase();
  testWithProvision(jsonFetch(204), `${method}() performs ${type.toLowerCase()} request`, (t, fetch) => {
    fetch[method]('/foo').then(({_res: {options}}) => {
      t.equals(options.method, type, `method is ${type}`);
      t.end();
    });
  });
}

testRequestType('get');
testRequestType('post');
testRequestType('put');
testRequestType('del');

testWithProvision(jsonFetch(204), 'a json response with a 204 status is not parsed', (t, {get}) => {
  get('/foo').then(res => {
    t.equals(Object.keys(res).length, 1, 'only the original response is returned');
    t.pass('does not error trying to json decode an undefined value');
    t.end();
  });
});

testWithProvision(jsonFetch(200, {hello: 'world'}), 'a json response with a 2xx status is parsed and returned', (t, {get}) => {
  get('/foo').then(res => {
    t.equals(Object.keys(res).length, 2, 'the original response is returned along with the json decoded response');
    t.equals(res.hello, 'world', 'the key/value returned is correct');
    t.end();
  });
});

testWithProvision(jsonFetch(200, 'Hello World!'), 'a non-object json response is converted into an object with the key "contents"', (t, {get}) => {
  get('/foo').then(res => {
    t.equals(Object.keys(res).length, 2, 'the original response is returned along with the converted response');
    t.equals(res.contents, 'Hello World!', 'the key/value returned is correct');
    t.end();
  });
});

testWithProvision(jsonFetch(400, {message: 'error'}), 'a json response with a 400+ status is parsed and an error is thrown', (t, {post}) => {
  post('/foo').catch(err => {
    t.equals(err.message, 'error', 'an error is thrown');
    t.end();
  });
});

testWithProvision(jsonFetch(204), 'get() query string is constucted from params and appended to url', (t, {get}) => {
  get('/foo', {bar: 'baz'}).then(({_res: {url, options}}) => {
    t.equals(url, '/foo?bar=baz', 'url has correct query string appended');
    t.end();
  });
});

testWithProvision(jsonFetch(204), 'get() params are added to existing query string', (t, {get}) => {
  get('/foo?hello=world', {bar: 'baz'}).then(({_res: {url, options}}) => {
    t.equals(url, '/foo?hello=world&bar=baz', 'url has correct query string appended');
    t.end();
  });
});

testWithProvision(jsonFetch(204), 'can override default req options', (t, {get}) => {
  get('/foo', undefined, {credentials: 'include'}).then(({_res: {url, options}}) => {
    t.equals(options.credentials, 'include', 'credentials is overidden');
    t.equals(options.headers.Accept, 'application/json', 'other defaults remain unchanged');
    t.end();
  });
});

testWithProvision(jsonFetch(204), 'post() parameters serialized into body as json on application/json content type', (t, {post}) => {
  post('/foo', {bar: 'baz', hello: 'world'}).then(({_res: {url, options}}) => {
    t.equals(options.body, '{"bar":"baz","hello":"world"}', 'body is JSON string of parameters');
    t.equals(url, '/foo', 'url remains the same');
    t.end();
  });
});

testWithProvision(jsonFetch(204), 'post() parameters serialized into body as key-value pairs on x-www-form-urlencoded', (t, {post}) => {
  post('/foo', {bar: 'baz', hello: 'world'}, {headers: {['Content-Type']: 'application/x-www-form-urlencoded'}}).then(({_res: {url, options}}) => {
    t.equals(options.body, 'bar=baz&hello=world', 'body is key-value string of parameters');
    t.end();
  });
});

testWithProvision(jsonFetch(204), 'post() parameters serialized as is into body if not json or x-www-form-urlencoded', (t, {post}) => {
  post('/foo', '<div/>', {headers: {['Content-Type']: 'text/html'}}).then(({_res: {url, options}}) => {
    t.equals(options.body, '<div/>', 'body is left as is');
    t.end();
  });
});

testWithProvision(jsonFetch(204), 'setting default values affects all future fetches', (t, {get, del, put, setDefaults}) => {
  get('/foo').then(({_res: {url, options}}) => {
    t.equals(options.headers['Accept'], 'application/json', 'original accept header set to json');
    setDefaults({headers: {Accept: 'text/html'}});
    del('/foo').then(({_res: {url, options}}) => {
      t.equals(options.headers['Accept'], 'text/html', 'accept header now set to html');
      put('/foo').then(({_res: {url, options}}) => {
        t.equals(options.headers['Accept'], 'text/html', 'accept header still set to html');
        t.end();
      });
    });
  });
});

const body = 'html';
testWithProvision(htmlFetch(400, body), 'an html response with a 400+ status is rejected with the response', (t, {post}) => {
  post('/foo').catch(res => res.text()).then(text => {
    t.equals(text, body, 'the response is returned as rejected param');
    t.end();
  });
});

testWithProvision(htmlFetch(200, body), 'an html response with a 2xx status is resolved with the response', (t, {post}) => {
  post('/foo').then(res => res.text()).then(text => {
    t.equals(text, body, 'the response is returned as resolved param');
    t.end();
  });
});
