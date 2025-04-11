import React from "react";

const About = () => {
  // Common styles as objects
  const containerStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "Arial, sans-serif",
  };

  const sectionStyle = {
    marginBottom: "3rem",
  };

  const headingStyle = {
    fontSize: "2.5rem",
    marginBottom: "1.5rem",
    color: "#333",
  };

  const paragraphStyle = {
    fontSize: "1.1rem",
    lineHeight: "1.6",
    marginBottom: "1rem",
    color: "#555",
  };

  const teamMemberStyle = {
    display: "flex",
    marginBottom: "2.5rem",
    alignItems: "center",
  };

  const memberPhotoStyle = {
    flex: "0 0 200px",
    marginRight: "2rem",
  };

  const imageStyle = {
    width: "200px",
    height: "200px",
    objectFit: "cover",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  };

  const memberBioStyle = {
    flex: "1",
  };

  const memberNameStyle = {
    fontSize: "1.8rem",
    marginBottom: "1rem",
    color: "#333",
  };

  return (
    <div style={containerStyle}>
      <section style={sectionStyle}>
        <h1 style={headingStyle}>Our Story</h1>
        <p style={paragraphStyle}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui
          mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor
          neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim.
          Phasellus molestie magna non est bibendum non venenatis nisl tempor.
          Suspendisse dictum feugiat nisl ut dapibus. Mauris iaculis porttitor
          posuere. Praesent id metus massa, ut blandit odio.
        </p>
        <p style={paragraphStyle}>
          Proin quis tortor orci. Etiam at risus et justo dignissim congue.
          Donec congue lacinia dui, a porttitor lectus condimentum laoreet. Nunc
          eu ullamcorper orci. Quisque eget odio ac lectus vestibulum faucibus
          eget in metus. In pellentesque faucibus vestibulum. Nulla at nulla
          justo, eget luctus tortor. Nulla facilisi. Duis aliquet egestas purus
          in blandit.
        </p>
      </section>

      <section style={sectionStyle}>
        <h1 style={headingStyle}>Our Team</h1>

        <div style={teamMemberStyle}>
          <div style={memberPhotoStyle}>
            <img src="/Kevin.jpeg" alt="Kevin" style={imageStyle} />
          </div>
          <div style={memberBioStyle}>
            <h2 style={memberNameStyle}>Kevin Ith, CEO and Founder</h2>
            <p style={paragraphStyle}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in
              dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed
              auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in
              nulla enim. Phasellus molestie magna non est bibendum non
              venenatis nisl tempor.
            </p>
          </div>
        </div>

        <div style={teamMemberStyle}>
          <div style={memberPhotoStyle}>
            <img src="/Victoria.jpeg" alt="Victoria" style={imageStyle} />
          </div>
          <div style={memberBioStyle}>
            <h2 style={memberNameStyle}>
              Victoria Guardino, Founding Designer
            </h2>
            <p style={paragraphStyle}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin
              nibh augue, suscipit a, scelerisque sed, lacinia in, mi. Cras vel
              lorem. Etiam pellentesque aliquet tellus. Phasellus pharetra nulla
              ac diam. Quisque semper justo at risus.
            </p>
          </div>
        </div>

        <div style={teamMemberStyle}>
          <div style={memberPhotoStyle}>
            <img src="/Ben.jpeg" alt="Ben" style={imageStyle} />
          </div>
          <div style={memberBioStyle}>
            <h2 style={memberNameStyle}>Ben Geier, Founding Engineer</h2>
            <p style={paragraphStyle}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
              nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi.
              Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum.
              Praesent mauris. Fusce nec tellus sed augue semper porta.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
