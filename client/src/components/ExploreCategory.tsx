import React, { useEffect, useState } from "react";
import { CategoryModel } from "../models/CategoryModel";
import { TransportationModel } from "../models/TransporationModel";
import { SocialPreferenceModel } from "../models/SocialPreferenceModel";
import User from "../models/UserModel";
import { generateAPIRequest } from "../services/ExploreService";
import { ExploreCardModel } from "../models/ExploreCardModel";
import ExploreCard from "./ExploreCard";
import { IconButton, Grid, Paper, Stack, Button, Box, CircularProgress } from "@mui/material";
import CategoryCard from "./CategoryCard";
import Modal from "@mui/material/Modal";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
interface ExploreCategoryProps {
  user: User;
  address: string[];
  category: CategoryModel;
  transportationPreferences: TransportationModel[];
  socialPreferences: SocialPreferenceModel[];
  lifestylePreferences: string;
  additionalInfo: string;
  onLoadComplete: () => void;
}

const ExploreCategory = React.memo((props: ExploreCategoryProps) => {
  const [results, setResults] = useState<ExploreCardModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [open, setOpen] = useState(false); // State to control the modal

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const fetchData = async (): Promise<ExploreCardModel[]> => {
    console.log("Fetching data for category", props.category.title);
    const response: ExploreCardModel[] = await generateAPIRequest(
      props.user,
      props.address,
      props.transportationPreferences,
      props.lifestylePreferences,
      props.additionalInfo,
      props.socialPreferences,
      props.category,
      props.category?.title
    );
    console.log("Response IN HERE", response);
    return response || [];
  };

  useEffect(() => {
    console.log("ENTERED HERE");
    setIsLoading(true);
    fetchData().then((data) => {
      setResults(data);
      props.onLoadComplete();
    }).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = async () => {
    console.log("handleLoadMore called");
    setIsLoadingMore(true);
    try {
      const newData = await fetchData();
      console.log("New data received:", newData);
      setResults(prevResults => {
        // Filter out duplicates based on place name
        const existingPlaces = new Set(prevResults.map(r => r.place));
        const uniqueNewResults = newData.filter(r => !existingPlaces.has(r.place));
        console.log("Adding new results:", uniqueNewResults.length);
        return [...prevResults, ...uniqueNewResults];
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const styles = {
    modal: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    },
  };

  return (
    <div>
      {isLoading ? (
        <div>
          <h1>Loading {props.category.title}...</h1>
          <progress value={undefined} />
        </div>
      ) : (
        <>
          <Stack direction="row" spacing={2}>
            <h1>{props.category.title}</h1>
            <IconButton color="success" onClick={handleOpen}>
              <SettingsSuggestIcon />
            </IconButton>
          </Stack>
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby={`${props.category.title}-modal-title`}
            aria-describedby={`${props.category.title}-modal-description`}
          >
            <Paper sx={styles.modal} elevation={2}>
              <CategoryCard categoryProp={props.category} />
            </Paper>
          </Modal>
          <Grid container spacing={2}>
            {results &&
              results.map((result, index) => (
                <Grid item xs={12} sm={6} md={4} key={`${result.title}-${index}`}>
                  <ExploreCard result={result} />
                </Grid>
              ))}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="text"
                  color="success"
                  fullWidth
                  sx={{ height: "36px" }}
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} color="success" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </div>
  );
});

export default ExploreCategory;
