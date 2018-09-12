import qs from 'qs';
import universalFetch from 'isomorphic-fetch';

export function setPromise(Promise: any) {
  // @ts-ignore
  universalFetch.Promise = Promise;
}

function isJsonResponse(response: Response) {
  const contentType = response.headers.get('Content-Type');
  return (contentType && contentType.indexOf('application/json') !== -1);
}

function parseResponse(response: any): any {
  return new Promise((resolve, reject) => {
    if (response.status === 204) resolve(response);
    Promise.resolve(isJsonResponse(response) ? response.json() : null).then(contents => {
      response.contents = contents;
      if (response.status >= 400) reject(response);
      else resolve(response);
    })
  });
}

function withQueryString(path: string, params = {}) {
  if (!Object.keys(params).length) return path;
  const parts = path.split('?');
  return `${parts[0]}?${qs.stringify({...qs.parse(parts[1]), ...params})}`;
}

function serializeBody(contentType: string, params: object) {
  switch (contentType) {
    case 'application/json': return JSON.stringify(params);
    case 'application/x-www-form-urlencoded': return qs.stringify(params);
    default: return params;
  }
}

enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE'
}

export function fetch(method: Method, path: string, params?: object, options?: {body: null}) {
  const req: any = {...options};
  req.method = method;
  if (params !== undefined && method !== Method.GET) {
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

type Handler = (response: any) => any;

function shorthand(defaults: object, handler: Handler, method: Method) {
  return (path: string, params?: object, options?: object) => {
    return fetch(method, path, params, {body: null, ...defaults, ...options}).then(handler);
  };
}

function withDefaults(defaults: object, handler: Handler = res => res) {
  return {
    get: shorthand(defaults, handler, Method.GET),
    post: shorthand(defaults, handler, Method.POST),
    put: shorthand(defaults, handler, Method.PUT),
    patch: shorthand(defaults, handler, Method.PATCH),
    del: shorthand(defaults, handler, Method.DELETE)
  };
}

export default withDefaults;
