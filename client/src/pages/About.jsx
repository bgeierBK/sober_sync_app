import React from "react";

const About = () => {
  return (
    <>
      <section className="section">
        <h2 className="title is-2">Our Story</h2>
        <section className="section">
          <block>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui
            mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor
            neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim.
            Phasellus molestie magna non est bibendum non venenatis nisl tempor.
            Suspendisse dictum feugiat nisl ut dapibus. Mauris iaculis porttitor
            posuere. Praesent id metus massa, ut blandit odio.
          </block>
          <block>
            Proin quis tortor orci. Etiam at risus et justo dignissim congue.
            Donec congue lacinia dui, a porttitor lectus condimentum laoreet. Nunc
            eu ullamcorper orci. Quisque eget odio ac lectus vestibulum faucibus
            eget in metus. In pellentesque faucibus vestibulum. Nulla at nulla
            justo, eget luctus tortor. Nulla facilisi. Duis aliquet egestas purus
            in blandit.
          </block>
        </section>
      </section>

      <section className="section">
        <h2 className="title is-2">Our Team</h2>
        <section className="section grid is-col-min-13">
          <div className="cell">
            <div className="card" style={{ width: 300, height: "auto", minWidth: 300 }}>
              <div className="card-image">
                <figure className="image is-1by1">
                  <img src="/Kevin.jpeg" alt="Kevin" />
                </figure>
              </div>
              <div class="card-content">
                <div>
                  <h4 className="title is-4">Kevin Ith</h4>
                  <h5 className="subtitle is-5">CEO and Founder</h5>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in
                    dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed
                    auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in
                    nulla enim. Phasellus molestie magna non est bibendum non
                    venenatis nisl tempor.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="cell">
            <div className="card" style={{ width: 300, height: "auto", minWidth: 300 }}>
              <div className="card-image">
                <figure className="image is-1by1">
                  <img src="/Victoria.jpeg" alt="Victoria" />
                </figure>
              </div>
              <div class="card-content">
                <div>
                  <h4 className="title is-4">Victoria Guardino</h4>
                  <h5 className="subtitle is-5">Founding Designer</h5>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in
                    dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed
                    auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in
                    nulla enim. Phasellus molestie magna non est bibendum non
                    venenatis nisl tempor.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="cell">
            <div className="card" style={{ width: 300, height: "auto", minWidth: 300 }}>
              <div className="card-image">
                <figure className="image is-1by1">
                  <img src="/Ben.jpeg" alt="Ben" />
                </figure>
              </div>
              <div class="card-content">
                <div>
                  <h4 className="title is-4">Ben Geier</h4>
                  <h5 className="subtitle is-5">Founding Engineer</h5>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in
                    dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed
                    auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in
                    nulla enim. Phasellus molestie magna non est bibendum non
                    venenatis nisl tempor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </>
  );
};

export default About;
