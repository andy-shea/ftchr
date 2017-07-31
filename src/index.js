import qs from 'qs';
import universalFetch from 'isomorphic-fetch';
import isPlainObject from 'lodash.isplainobject';

export function setPromise(Promise) {
  universalFetch.Promise = Promise;
}

function isJsonResponse(res) {
  const contentType = res.headers.get('Content-Type');
  return (contentType && contentType.indexOf('application/json') !== -1);
}

function parseResponse(response) {
  return new Promise((resolve, reject) => {
    if (response.status === 204) resolve(response);
    Promise.resolve(isJsonResponse(response) ? response.json() : null).then(contents => {
      response.contents = contents;
      if (response.status >= 400) reject(response);
      else resolve(response);
    })
  });
}

function withQueryString(path, params = {}) {
  if (!Object.keys(params).length) return path;
  const parts = path.split('?');
  return `${parts[0]}?${qs.stringify({...qs.parse(parts[1]), ...params})}`;
}

function serializeBody(contentType, params) {
  switch (contentType) {
    case 'application/json': return JSON.stringify(params);
    case 'application/x-www-form-urlencoded': return qs.stringify(params);
    default: return params;
  }
}

export function fetch(method, path, params = undefined, options = {body: null}) {
  const req = {...options};
  req.method = method;
  if (params !== undefined && method !== 'GET') {
    req.body = serializeBody(req.headers && req.headers['Content-Type'], params);
  }
  const url = (method === 'GET') ? withQueryString(path, params) : path;
  return universalFetch(url, req).then(parseResponse);
}

export const get = fetch.bind(undefined, 'GET');
export const post = fetch.bind(undefined, 'POST');
export const put = fetch.bind(undefined, 'PUT');
export const patch = fetch.bind(undefined, 'PATCH');
export const del = fetch.bind(undefined, 'DELETE');

function shorthand(defaults, handler, method) {
  return (path, params = undefined, options = {body: null}) => {
    return fetch(method, path, params, {...defaults, ...options}).then(handler);
  };
}

function withDefaults(defaults, handler = res => res) {
  return {
    get: shorthand(defaults, handler, 'GET'),
    post: shorthand(defaults, handler, 'POST'),
    put: shorthand(defaults, handler, 'PUT'),
    patch: shorthand(defaults, handler, 'PATCH'),
    del: shorthand(defaults, handler, 'DELETE')
  };
}

export default withDefaults;
