// ==UserScript==
// @name         Spark-LLM
// @namespace    https://lxy.hnie.edu.cn/
// @version      0.3
// @description  讯飞大语言模型web端转api，使用jupyter kernelgateway做中介
// @author       Kaiyokun
// @match        https://xinghuo.xfyun.cn/desk
// @icon         https://xinghuo.xfyun.cn/spark-icon.ico
// @grant        GM_xmlhttpRequest
// @run-at       document-idle
// ==/UserScript==

'use strict';

const SECOND = 1e3;
const MINUTE = 60 * SECOND;

const urlfor = (endpoint = '/') => new URL(endpoint, 'http://106.52.71.200:8888/');

const delay = async ms => new Promise(resolve => setTimeout(resolve, ms));

const waitFor = async (f, timeout = 10 * SECOND) => new Promise((resolve, reject) => {
  let pollTimer = null;
  const tickTimer = setTimeout(() => {
    clearInterval(pollTimer);
    reject(`Wait for ${f} timeout in ${timeout / SECOND} sec(s).`);
  }, timeout);
  pollTimer = setInterval(async () => {
    try {
      const ret = await f();
      resolve(ret);
      clearInterval(pollTimer);
      clearTimeout(tickTimer);
    } catch {
      // noop
    }
  }, 1 * SECOND);
});

const waitForElement = async (selector, options = {}) => {
  const { timeout = 2 * MINUTE, root = document } = options;
  return waitFor(() => {
    const el = root.querySelector(selector);
    if (!el) {
      throw null;
    }
    return el;
  }, timeout);
};

const cors = async (endpoint, options = {}) => new Promise((resolve, reject) => {
  const { method = 'get', timeout = 2 * MINUTE, body } = options;
  let headers, data;
  if (body) {
    headers = { 'Content-Type': 'application/json' };
    data = JSON.stringify(body);
  }
  GM_xmlhttpRequest({
    method,
    url: urlfor(endpoint),
    redirect: 'follow',
    headers,
    timeout,
    responseType: 'json',
    data,
    onload(r) {
      resolve(r.response);
    },
    onerror: reject,
    ontimeout: reject
  });
});

const getQuestion = async () => {
  const { result, message, data } = await cors('/ask');
  if (result) {
    return data;
  }
  // 获取问题异常
  console.log(message);
};

const answerQuestion = async (body) => {
  const { result, message } = await cors('/answer', { method: 'post', body });
  if (!result) {
    // 回答问题异常
    console.log(message);
  }
};

const serveForever = async (ask, newChat) => {
  while (true) {
    try {
      await delay(10 * SECOND);
      console.log("等待获取问题");

      const input = await getQuestion();
      if (!input) {
        continue;
      }

      const { id, question, refresh } = input;
      if (refresh) {
        await newChat();
      }

      const answer = await ask(question);
      await answerQuestion({ id, question, answer });
    }
    catch (e) {
      console.log(e);
    }
  }
};

const ask = async question => new Promise(async (resolve, reject) => {
  try {
    const questionArea = await waitForElement('#ask-window > textarea');
    questionArea.value = question;

    const submitButton = await waitForElement('[class^="ask-window_send"]');
    submitButton.addEventListener(
      'click',
      async () => {
        try {
          await waitForElement('[class^="chat-window_re_answer"]');
          resolve(document.querySelector('.result-inner').innerHTML);
        }
        catch {
          const recreate = document.querySelector('[class^="chat-window_l_r"] > span');
          if (recreate) {
            recreate.click();
          }
          resolve();
        }
      },
      { once: true }
    );
    submitButton.click();
  }
  catch (e) {
    reject(e);
  }
});

const newChat = async () => new Promise(async resolve => {
  try {
    const refreshButton = await waitForElement('[class^="ask-window_top_buttons"] > div');
    refreshButton.click();

    await waitForElement('[class^="chat-window_history_line_wrap"]');
  }
  catch {
    const recreate = document.querySelector('[class^="chat-window_l_r"] > span');
    if (recreate) {
      recreate.click();
    }
  }
  resolve();
});

serveForever(ask, newChat);
