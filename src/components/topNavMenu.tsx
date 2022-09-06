import * as React from "react";

export function TopNavMenu(): JSX.Element {
  return (
    <nav
      className="w-full flex items-center mx-auto my-0 px-3 py-6 flex-col md:px-6 md:py-12 sm:flex-row"
      style={{ maxWidth: "800px" }}
    >
      <div className="flex-1 flex items-center mb-4 sm:mb-0 cursor-pointer">
        <a href="/" className="text-gray-900 no-underline">
          <img
            className="inline align-middle"
            style={{ width: "4em", height: "4em" }}
            src="/images/logo.svg"
            alt="Liftosaur Logo"
          />
          <span
            className="inline text-3xl font-bold leading-loose text-gray-900 align-middle"
            style={{ marginLeft: "8px", fontFamily: "Poppins" }}
          >
            Liftosaur
          </span>
        </a>
      </div>
      <div className="flex items-center justify-center w-full sm:block sm:w-auto">
        <ul className="flex-1 inline-block align-middle list-none">
          {[
            ["App", "/"],
            ["Documentation", "/docs/docs.html"],
            ["Blog", "/blog"],
          ].map(([text, link]) => {
            return (
              <li className="inline-block mx-4 my-0 leading-normal align-middle list-none">
                <a className="text-blue-700 underline cursor-pointer" href={link}>
                  {text}
                </a>
              </li>
            );
          })}
        </ul>
        <ul className="inline-block align-middle list-none">
          {[
            ["Facebook", "https://www.facebook.com/liftosaur", "logo-facebook"],
            ["Twitter", "https://www.twitter.com/liftosaur", "logo-twitter"],
            ["Reddit", "https://www.reddit.com/r/liftosaur", "logo-reddit"],
          ].map(([text, link, img]) => {
            return (
              <li className="inline-block align-middle list-none">
                <a
                  target="_blank"
                  href={link}
                  style={{
                    textIndent: "-9999px",
                    backgroundPosition: "50%",
                    backgroundSize: "60%",
                    backgroundImage: `url(/images/${img}.svg)`,
                  }}
                  className="inline-block w-10 h-10 p-2 bg-no-repeat"
                >
                  <span>{text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
