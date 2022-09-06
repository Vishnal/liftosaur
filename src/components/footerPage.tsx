import * as React from "react";

export function FooterPage(): JSX.Element {
  return (
    <footer>
      <div
        className="w-full bg-no-repeat"
        style={{
          paddingBottom: "9%",
          backgroundSize: "100% auto",
          backgroundImage: "url(/images/desktop-wave-footer.svg)",
        }}
      ></div>
      <div style={{ backgroundColor: "#fafafa" }}>
        <div className="flex flex-col px-6 py-0 mx-auto my-0 md:flex-row" style={{ maxWidth: "800px" }}>
          <nav className="flex items-center flex-1 px-0 py-6 leading-loose text-left md:text-right md:py-12 md:px-3">
            <ul className="flex-1 md:pr-6">
              {[
                ["App", "/"],
                ["Documentation", "/docs/docs.html"],
                ["Blog", "/blog"],
                ["Terms & Conditions", "/terms.html"],
                ["Privacy", "/privacy.html"],
              ].map(([text, link]) => {
                return (
                  <li className="inline-block mx-4 my-0 text-left">
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
                  <li className="inline-block text-left align-middle list-none">
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
          </nav>
        </div>
      </div>
    </footer>
  );
}
