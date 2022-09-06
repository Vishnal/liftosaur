import * as React from "react";
import * as ReactDOMClient from "react-dom/client";
import { UsersContent } from "./components/admin/usersContent";
import { LogsContent } from "./components/admin/logsContent";

function main(): void {
  const escapedRawData = document.querySelector("#data")?.innerHTML || "{}";
  const parser = new DOMParser();
  const unescapedRawData = parser.parseFromString(escapedRawData, "text/html").documentElement.textContent || "{}";
  const data = JSON.parse(unescapedRawData);
  const url = document.location.pathname;
  if (url.indexOf("users") !== -1) {
    ReactDOMClient.hydrateRoot(document.getElementById("app")!, <UsersContent {...data} />);
  } else if (url.indexOf("logs") !== -1) {
    ReactDOMClient.hydrateRoot(document.getElementById("app")!, <LogsContent {...data} />);
  }
}

main();
