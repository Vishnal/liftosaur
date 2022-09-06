import * as React from "react";
import * as ReactDOM from "react-dom";
import { UsersContent } from "./components/admin/usersContent";
import { LogsContent } from "./components/admin/logsContent";

function main(): void {
  const escapedRawData = document.querySelector("#data")?.innerHTML || "{}";
  const parser = new DOMParser();
  const unescapedRawData = parser.parseFromString(escapedRawData, "text/html").documentElement.textContent || "{}";
  const data = JSON.parse(unescapedRawData);
  const url = document.location.pathname;
  if (url.indexOf("users") !== -1) {
    ReactDOM.hydrate(<UsersContent {...data} />, document.getElementById("app")!);
  } else if (url.indexOf("logs") !== -1) {
    ReactDOM.hydrate(<LogsContent {...data} />, document.getElementById("app")!);
  }
}

main();
