import universalFetch from 'isomorphic-fetch';

universalFetch.Promise = require('bluebird');

function withQueryString(path, params = {}) {
  if (!Object.keys(params).length) return path;
  return `${path}?` + Object.keys(params).map(param => {
    return `${encodeURIComponent(param)}=${encodeURIComponent(params[param])}`;
  }).join('&');
}

let defaults = {
  credentials: 'same-origin',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
};

function fetch(method, path, params = undefined, options = {body: null}) {
  options.method = method;
  if (params !== undefined && method !== 'GET') options.body = JSON.stringify(params);
  return universalFetch(method === 'GET' ? withQueryString(path, params) : path, Object.assign(defaults, options)).then(response => {
    if (response.status !== 204) {
      const json = response.json();
      if (response.status >= 400) throw new Error(response.message);
      return json;
    }
  });
}

export const get = fetch.bind(undefined, 'GET');
export const post = fetch.bind(undefined, 'POST');
export const put = fetch.bind(undefined, 'PUT');
export const del = fetch.bind(undefined, 'DELETE');

export function setDefaults(defaultOptions) {
  defaults = defaultOptions;
}

export default {get, post, put, del};
