import React from "react";
import {
  Container,
  Typography,
  Button,
  Link,
  Card,
  CardContent,
  Grid,
  Stack,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";

const features = [
  {
    id: 1,
    title: "AI-Powered Recommendations",
    content:
      "Nested uses Google's Gemini AI to analyze your preferences and provide personalized recommendations for places in your new city.",
  },
  {
    id: 2,
    title: "Google Takeout Integration",
    content:
      "Upload your Google Maps activity to automatically understand your lifestyle preferences and get tailored suggestions.",
  },
  {
    id: 3,
    title: "Smart Category Matching",
    content:
      "Find restaurants, gyms, parks, coffee shops, and more that match your specific tastes and requirements.",
  },
];

const SuccessPage = () => {
  return (
    <Container>
      <section
        id="features"
        style={{
          padding: "2em 0",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h4"
          style={{ color: "#004d40", marginBottom: "1em" }}
        >
          Key Features
        </Typography>
        <Typography
          variant="body1"
          style={{ marginBottom: "2em", padding: "0 2em" }}
        >
          NestBuilder helps you move to a new city with ease by matching you with
          places based on your lifestyle. It analyzes your Google Maps search
          history to understand your preferences, and then provides tailored
          suggestions to nearby grocery stores, gyms, museums, and more!
        </Typography>
        <Stack
          direction="row"
          justifyContent={"center"}
          p="0.5rem"
          gap={"1rem"}
        >
          <Link
            href="https://github.com/SVstudent/NestBuilder"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <Button
              startIcon={<GitHubIcon color="action" />}
              variant="outlined"
              color="success"
              style={{
                marginBottom: "2em",
              }}
            >
              View GitHub Repository
            </Button>
          </Link>
        </Stack>
        <Typography
          variant="h5"
          style={{ color: "#004d40", marginBottom: "1em" }}
        >
          What We Offer
        </Typography>
        <Grid container spacing={2} justifyContent="center">
          {features.map((feature) => (
            <Grid key={feature.id} item xs={12} sm={6} md={4}>
              <Card
                style={{
                  textAlign: "center",
                  minHeight: "10rem",
                  padding: "1em",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <CardContent>
                  <Typography variant="h6" style={{ fontWeight: "bold", marginBottom: "0.5em" }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2">
                    {feature.content}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </section>
    </Container>
  );
};

export default SuccessPage;

