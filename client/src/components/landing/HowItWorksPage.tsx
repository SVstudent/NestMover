import {
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from "@mui/material";
import React from "react";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ExploreIcon from "@mui/icons-material/Explore";

const HowItWorksPage = () => {
  return (
    <Grid container spacing={2} sx={{ padding: "2rem" }}>
      <Grid item xs={12} md={6}>
        <Typography variant="h5" gutterBottom>
          How it Works
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <PlayArrowIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1">
                  Connect your Google Account for a seamless onboarding
                  experience.
                </Typography>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PlayArrowIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1">
                  Search for any type of place you'd like to explore in your new
                  city – gyms, restaurants, museums, and more!
                </Typography>
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <PlayArrowIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1">
                  Discover hidden gems and save your favorite places to build
                  your perfect Nest.
                </Typography>
              }
            />
          </ListItem>
        </List>
      </Grid>
      <Grid item xs={12} md={6} textAlign={"center"}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            backgroundColor: "#e8f5e9",
            borderRadius: "12px",
            padding: "2rem",
          }}
        >
          <ExploreIcon sx={{ fontSize: 120, color: "#4caf50" }} />
        </Box>
      </Grid>
    </Grid>
  );
};

export default HowItWorksPage;
