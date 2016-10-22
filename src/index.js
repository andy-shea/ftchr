import qs from 'qs';
import universalFetch from 'isomorphic-fetch';
import isPlainObject from 'lodash.isplainobject';

universalFetch.Promise = require('bluebird');

let defaults = {
  credentials: 'same-origin',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

export function setDefaults(defaultOptions) {
  defaults = defaultOptions;
}

function isJsonResponse(res) {
  const contentType = res.headers.get('Content-Type');
  return (contentType && contentType.indexOf('application/json') !== -1);
}

function parseResponse(response) {
  return Promise.resolve().then(() => {
    if (isJsonResponse(response) && response.status !== 204) {
      return response.json().then(contents => {
        if (response.status >= 400) throw new Error(contents.message);
        return isPlainObject(contents) ? contents : {contents};
      });
    }
    return {};
  }).then(contents => ({...contents, _res: response}));
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

function fetch(method, path, params = undefined, options = {body: null}) {
  const req = Object.assign(defaults, options);
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
export const del = fetch.bind(undefined, 'DELETE');

export default {get, post, put, del, setDefaults};
