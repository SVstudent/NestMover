import React from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { SvgIcon } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import { TeamMember } from "../../models/TeamMemberModel";

const coreTeam: TeamMember[] = [
  {
    name: "Sathvik Vempati",
    title: "Software Developer",
    imageUrl: "", // Will use default avatar
    bio: "Sathvik is a passionate software developer with experience in full-stack development using React, TypeScript, Python, and Firebase. He built Nested to help people moving to new cities discover personalized recommendations powered by AI. His focus is on creating intuitive user experiences and leveraging modern technologies to solve real-world problems.",
    email: "vempati.honey@gmail.com",
    github: "https://github.com/sathvikvempati",
    linkedin: "https://www.linkedin.com/in/sathvikvempati",
  },
];

const AboutUsPage = () => {

  const handleEmailClick = (member: TeamMember) => {
    const email = member.email || "";
    window.location.href = `mailto:${email}`;
  };

  return (
    <Box
      sx={{
        width: "90%",
        margin: "auto",
        paddingTop: "2rem",
        paddingBottom: "4rem",
      }}
    >
      <Typography variant="h3" align="center" gutterBottom>
        The Core Team
      </Typography>
      <Stack direction="row" spacing={4} justifyContent="center">
        {coreTeam.map((member) => (
          <Box
            sx={{
              width: "27rem",
              maxWidth: "100%",
              boxShadow: "lg",
              borderRadius: 4,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignContent: "center",
                alignItems: "center",
                paddingTop: "2rem",
                paddingBottom: "1rem",
                gap: "2rem",
              }}
            >
              <Avatar
                alt={member.name}
                src={member.imageUrl}
                style={{ width: "4rem", height: "4rem" }}
              />
              <Box>
                <Typography variant="h4" align="center" gutterBottom>
                  {member.name}
                </Typography>
                <Typography variant="subtitle1" align="center" gutterBottom>
                  {member.title}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              {member.bio && (
                <Typography variant="body1" sx={{ textAlign: "center" }}>
                  {member.bio}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                margin: "0.5rem",
                width: "100%",
              }}
            >
              {member.github && (
                <IconButton href={member.github} target="_blank" rel="noreferrer">
                  <SvgIcon>
                    <GitHubIcon />
                  </SvgIcon>
                </IconButton>
              )}
              {member.linkedin && (
                <IconButton href={member.linkedin} target="_blank" rel="noreferrer">
                  <SvgIcon>
                    <LinkedInIcon />
                  </SvgIcon>
                </IconButton>
              )}
              {member.instagram && (
                <IconButton href={member.instagram} target="_blank" rel="noreferrer">
                  <SvgIcon>
                    <InstagramIcon />
                  </SvgIcon>
                </IconButton>
              )}
              {member.twitter && (
                <IconButton href={member.twitter} target="_blank" rel="noreferrer">
                  <SvgIcon>
                    <TwitterIcon />
                  </SvgIcon>
                </IconButton>
              )}
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}
            >
              <Button variant="outlined" color="success" onClick={() => handleEmailClick(member)}>
                Message Me
              </Button>
            </Box>
          </Box>
        ))}
      </Stack>

    </Box>
  );
};

export default AboutUsPage;
