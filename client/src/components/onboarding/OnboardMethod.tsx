import React, { useCallback, useEffect, useState } from "react";
import { UserAuth } from "../../context/AuthContext";
import { formatBirthday } from "../../utils/RandomUtils";
import GoogleDrivePicker from "react-google-drive-picker";
import {
  createAddressInstruction,
  createCategoriesInstruction,
  createSocialPreferencesInstruction,
  createTransportationInstruction,
  sendProfileRequest,
} from "../../services/FullOnboardingProfileService";
import { OnboardPageProps } from "../../models/OnboardPageProps";
import {
  Typography,
  Paper,
  TextField,
  Avatar,
  Stack,
  Button,
  CircularProgress,
} from "@mui/material";
import { CategoryModel } from "../../models/CategoryModel";
import { SocialPreferenceModel } from "../../models/SocialPreferenceModel";
import { TransportationModel } from "../../models/TransporationModel";
import { ref, set, update, get } from "firebase/database";
import { database } from "../../firebase.config";
import UserModel from "../../models/UserModel";
import googleDriveIcon from "../../assets/icons8-google-drive.svg";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GenerateWithGemini from "../GenerateWithGemini";
import { initialIntroPromptMarkdown } from "../../constants/OnboardingTooltipConstants";

const OnboardMethod = (props: OnboardPageProps) => {
  const auth = UserAuth();
  const [openPicker] = GoogleDrivePicker();
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [gender, setGender] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [addressInstructionStatus, setAddressInstructionStatus] = useState<
    "loading" | "done" | "error" | undefined
  >(undefined);
  const [transportationInstructionStatus, setTransportationInstructionStatus] =
    useState<"loading" | "done" | "error" | undefined>(undefined);
  const [categoriesInstructionStatus, setCategoriesInstructionStatus] =
    useState<"loading" | "done" | "error" | undefined>(undefined);
  const [
    socialPreferencesInstructionStatus,
    setSocialPreferencesInstructionStatus,
  ] = useState<"loading" | "done" | "error" | undefined>(undefined);

  // Load existing progress from Firebase on mount
  useEffect(() => {
    if (auth?.user) {
      const userRef = ref(database, `users/${auth.user.id}`);
      get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();

          // Check for address data
          if (userData.homeAddress || userData.workAddress) {
            setAddressInstructionStatus("done");
          }

          // Check for transportation data
          if (userData.transportations && Object.keys(userData.transportations).length > 0) {
            setTransportationInstructionStatus("done");
          }

          // Check for categories data
          if (userData.categories && Object.keys(userData.categories).length > 0) {
            setCategoriesInstructionStatus("done");
          }

          // Check for social preferences data
          if (userData.socialPreferences && Object.keys(userData.socialPreferences).length > 0) {
            setSocialPreferencesInstructionStatus("done");
          }

          if (userData.birthday && userData.gender) {
            setBirthday(new Date(userData.birthday));
            setGender(userData.gender);
          } else {
            fetchGoogleInfo();
          }
        } else {
          fetchGoogleInfo();
        }
      }).catch((error) => {
        console.error("Error loading initial onboarding state:", error);
      });
    }
  }, [auth?.user]);

  // Function to generate the address data and save it to the database
  const getAddressData = useCallback(
    async (file: any) => {
      try {
        setAddressInstructionStatus("loading");
        const addressInstruction = createAddressInstruction();
        const addressData = await sendProfileRequest(addressInstruction, file);
        console.log("Address Data received: ", addressData);

        // Validate the response
        if (!addressData) {
          throw new Error("No address data received from API");
        }
        if (!addressData.homeAddress && !addressData.workAddress) {
          console.warn("Address data is missing both homeAddress and workAddress");
        }

        if (auth?.user) {
          const userRef = ref(database, `users/${auth.user.id}`);
          const updates: Partial<UserModel> = {
            homeAddress: addressData.homeAddress || "",
            workAddress: addressData.workAddress || "",
          };
          console.log("Saving address updates to Firebase:", updates);
          await update(userRef, updates);
          console.log("Address data saved successfully");
        }
        setAddressInstructionStatus("done");
      } catch (error) {
        console.error("Error getting address data:", error);
        setAddressInstructionStatus("error");
        throw error; // Re-throw to be caught by uploadFile
      }
    },
    [auth?.user]
  );

  // Function to generate the transportation data and save it to the database
  const getTransportationData = useCallback(
    async (file: any) => {
      try {
        setTransportationInstructionStatus("loading");
        const transportationInstruction = createTransportationInstruction();
        const transportationData = await sendProfileRequest(
          transportationInstruction,
          file
        );
        console.log("Transportation Data received: ", transportationData);

        // Validate the response
        if (!transportationData) {
          throw new Error("No transportation data received from API");
        }
        if (!transportationData.transportation || !Array.isArray(transportationData.transportation)) {
          throw new Error("Invalid transportation data format - expected 'transportation' array");
        }
        if (transportationData.transportation.length === 0) {
          console.warn("Transportation array is empty");
        }

        if (auth?.user) {
          const transportations: TransportationModel[] = transportationData.transportation;

          // Construct the full object to update at once to avoid race conditions
          const transportationsObj: { [key: string]: TransportationModel } = {};
          transportations.forEach((t) => {
            if (t && t.method) {
              transportationsObj[t.method] = t;
            }
          });

          console.log("Saving transportation to Firebase:", transportationsObj);
          const userRef = ref(
            database,
            `users/${auth.user.id}/transportations`
          );
          await set(userRef, transportationsObj);
          console.log("Transportation data saved successfully");
        }
        setTransportationInstructionStatus("done");
      } catch (error) {
        console.error("Error getting transportation data:", error);
        setTransportationInstructionStatus("error");
        throw error;
      }
    },
    [auth?.user]
  );

  // Function to generate the categories data and save it to the database
  const getCategoriesData = useCallback(
    async (file: any) => {
      try {
        setCategoriesInstructionStatus("loading");
        const categoriesInstruction = createCategoriesInstruction();
        const categoriesData = await sendProfileRequest(
          categoriesInstruction,
          file
        );
        console.log("Categories Data received: ", categoriesData);

        // Validate the response
        if (!categoriesData) {
          throw new Error("No categories data received from API");
        }
        if (!categoriesData.categories || !Array.isArray(categoriesData.categories)) {
          throw new Error("Invalid categories data format - expected 'categories' array");
        }
        if (categoriesData.categories.length === 0) {
          console.warn("Categories array is empty");
        }

        if (auth?.user) {
          const categories: CategoryModel[] = categoriesData.categories;

          // Construct the full object to update at once
          const categoriesObj: { [key: string]: CategoryModel } = {};
          categories.forEach((c) => {
            if (c && c.title) {
              categoriesObj[c.title] = c;
            }
          });

          console.log("Saving categories to Firebase:", categoriesObj);
          const userRef = ref(database, `users/${auth.user.id}/categories`);
          await set(userRef, categoriesObj);
          console.log("Categories data saved successfully");
        }
        setCategoriesInstructionStatus("done");
      } catch (error) {
        console.error("Error getting categories data:", error);
        setCategoriesInstructionStatus("error");
        throw error;
      }
    },
    [auth?.user]
  );

  // Function to generate the social preferences data and save it to the database
  const getSocialPreferencesData = useCallback(
    async (file: any) => {
      try {
        setSocialPreferencesInstructionStatus("loading");
        const socialPreferencesInstruction =
          createSocialPreferencesInstruction();
        const socialPreferencesData = await sendProfileRequest(
          socialPreferencesInstruction,
          file
        );
        console.log("Social Preferences Data received: ", socialPreferencesData);

        // Validate the response
        if (!socialPreferencesData) {
          throw new Error("No social preferences data received from API");
        }

        if (auth?.user) {
          const socialPreferences: SocialPreferenceModel[] =
            socialPreferencesData.socialPreferences || [];

          const otherPreferences: any[] = socialPreferencesData.otherPreferences || [];
          const lifestylePreferences: string =
            socialPreferencesData.lifestyleParagraph || "";

          console.log("Social Preferences: ", socialPreferences);
          console.log("Other Preferences: ", otherPreferences);
          console.log("Lifestyle Preferences: ", lifestylePreferences);

          // Construct the full object for update
          const prefsObj: { [key: string]: SocialPreferenceModel } = {};

          socialPreferences.forEach((sp) => {
            if (sp && sp.name) {
              prefsObj[sp.name] = sp;
            }
          });

          otherPreferences.forEach((name: string) => {
            if (name && !prefsObj[name]) {
              prefsObj[name] = {
                name,
                selected: false,
              };
            }
          });

          console.log("Saving social preferences to Firebase:", prefsObj);
          const userRef = ref(
            database,
            `users/${auth.user.id}/socialPreferences`
          );
          await set(userRef, prefsObj);
          console.log("Social preferences saved successfully");

          if (lifestylePreferences) {
            const lifestyleRef = ref(
              database,
              `users/${auth.user.id}/lifestylePreferences`
            );
            await update(lifestyleRef, { lifestylePreferences });
            console.log("Lifestyle preferences saved successfully");
          }
        }
        setSocialPreferencesInstructionStatus("done");
      } catch (error) {
        console.error("Error getting social preferences data:", error);
        setSocialPreferencesInstructionStatus("error");
        throw error;
      }
    },
    [auth?.user]
  );

  const uploadFile = async (file: any) => {
    setLoading(true);
    setAddressInstructionStatus("loading");
    setTransportationInstructionStatus("loading");
    setCategoriesInstructionStatus("loading");
    setSocialPreferencesInstructionStatus("loading");

    try {
      // Execute sequentially to avoid overwhelming the backend
      await getAddressData(file);
      await getTransportationData(file);
      await getCategoriesData(file);
      await getSocialPreferencesData(file);
    } catch (error) {
      console.error("Critical error during file onboarding process:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle local file upload (alternative to Google Drive)
  const handleLocalFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Local file selected:", file.name);
      uploadFile(file);
    }
  };

  const handleGoogleDrivePickerOpen = () => {
    const token = localStorage.getItem("accessToken") || "";
    if (!token) {
      console.error("No token found");
      return;
    }
    openPicker({
      clientId: "",
      developerKey: "",
      viewId: "DOCS",
      token: token,
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect: false,

      callbackFunction: async (data) => {
        if (data.action === "cancel") {
          console.log("User clicked cancel/close button");
        } else if (data.docs && data.docs.length > 0) {
          console.log(data);

          const file = data.docs[0];
          console.log("File metadata: ", file);

          try {
            fetch("https://nestbuilder-api-138172744112.us-central1.run.app/get-google-drive-file", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                oauth_token: token,
                file_id: file.id,
              }),
            })
              .then((response) => response.arrayBuffer())
              .then((data) => {
                const blob = new Blob([data]);
                const file = new File([blob], "Google_Takeout_Data");
                console.log(file);
                uploadFile(file);
              })
              .catch((error) => console.error(error));
          } catch (error) {
            console.error(error);
          }
        }
      },
    });
  };

  const saveData = useCallback(() => {
    // Save data logic here...
    console.log("Save Data: ", { birthday: birthday, gender: gender });
    if (auth?.user) {
      const userRef = ref(database, `users/${auth.user.id}`);
      update(userRef, { birthday: birthday, gender: gender }).catch((error) => {
        console.error("Error updating user data:", error);
      });
    }
  }, [auth?.user, birthday, gender]);

  //TODO: Make this into a service in FullOnboardingProfileService
  const fetchGoogleInfo = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No token found");
      return;
    }

    if (!birthday || !gender) {
      const response = await fetch("https://nestbuilder-api-138172744112.us-central1.run.app/fetch-people-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
        }),
      });

      if (!response.ok) {
        console.log("Error fetching Google Info. Response: ", response);
        return null;
      }

      const googleInfo = await response.json();
      console.log("NEW Google Info: ", googleInfo);

      let userBirthday = null;
      let userGender = null;

      if (googleInfo?.birthdays) {
        for (const birthday of googleInfo.birthdays) {
          if (birthday.date && birthday.date.year) {
            userBirthday = new Date(
              birthday.date.year,
              birthday.date.month - 1,
              birthday.date.day
            );
            break; // Exit the loop after finding a birthday with year
          }
        }
      }

      if (googleInfo?.genders) {
        userGender = googleInfo.genders[0]?.formattedValue;
      }

      setBirthday(userBirthday);
      setGender(userGender);
    }
  }, [birthday, gender]);

  // No need for a separate useEffect to load user data as it's now handled in the initialization useEffect at the top

  useEffect(() => {
    props.registerSave(saveData);
  }, [props, props.registerSave, saveData]);

  const styles = {
    container: {
      display: "flex",
      flexDirection: "row" as "row",
      justifyContent: "space-around",
      padding: "20px",
    },
    halfWidth: {
      width: "48%",
      boxSizing: "border-box" as "border-box",
    },
    paper: {
      display: "flex",
      flexDirection: "column" as "column",
      padding: "1.25rem",
      borderRadius: "0.5rem",
      backgroundColor: "#F3F5EA",
    },
    statusContainer: {
      display: "flex",
      flexDirection: "row" as "row",
      alignItems: "center",
      gap: "0.5rem",
    },
    statusTitle: { fontWeight: "bold", color: "dimgray" },
  };

  return (
    <>
      <Typography
        variant="h4"
        sx={{ marginTop: "1rem", marginBottom: "0.5rem", textAlign: "center" }}
      >
        Let’s Make Your New City Feel Like Home
      </Typography>
      <Typography variant="body2" sx={{ textAlign: "center" }}>
        Nested leverages Gemini (Google’s latest LLM) to find places in your
        new city that can facilitate your lifestyle.
      </Typography>
      <Typography variant="body2" mb="1.5rem" sx={{ textAlign: "center" }}>
        First, please answer some questions so Nested can provide better
        suggestions:
      </Typography>
      <div style={styles.container}>
        <div style={styles.halfWidth}>
          <Paper variant="outlined" style={styles.paper}>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", marginBottom: "0.5rem" }}
            >
              Basic Info
            </Typography>
            <Typography
              variant="body2"
              sx={{ alignSelf: "center", marginBottom: "1.5rem" }}
            >
              We are pulling this information from your Google Account. If it is
              incorrect, please update it here.
            </Typography>
            <Stack direction={"row"} spacing={2} sx={{ alignItems: "center" }}>
              <Avatar
                sx={{ width: 100, height: 100 }}
                src={auth?.user?.photoURL}
                alt="UserPicture"
              />
              <Stack spacing={2} width={"100%"}>
                <TextField
                  size="small"
                  type="text"
                  label="Name"
                  defaultValue={auth?.user?.name}
                  fullWidth
                  margin="none"
                />
                <TextField
                  size="small"
                  type="text"
                  label="Email"
                  defaultValue={auth?.user?.email}
                  fullWidth
                />

                <TextField
                  size="small"
                  type="text"
                  label="Birthday"
                  value={birthday ? formatBirthday(birthday) : ""}
                  fullWidth
                  onChange={(e) => setBirthday(new Date(e.target.value))}
                />

                <TextField
                  size="small"
                  type="text"
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  fullWidth
                />
              </Stack>
            </Stack>
          </Paper>
        </div>
        <div style={styles.halfWidth}>
          <Paper variant="outlined" style={styles.paper}>
            <Stack
              direction={"row"}
              justifyContent={"space-between"}
              width={"100%"}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", marginBottom: "0.5rem" }}
              >
                AI Onboarding [Optional]
              </Typography>

              <GenerateWithGemini prompt={initialIntroPromptMarkdown} />
            </Stack>
            <Typography
              variant="body2"
              sx={{ alignSelf: "center", marginBottom: "1.5rem" }}
            >
              Adding your Google Takeout data helps Nested autofill onboarding
              questions to save you time and is not stored. You also have the
              option to answer questions manually, up to you!
            </Typography>

            <Button
              component="label"
              role={undefined}
              variant="text"
              color="inherit"
              tabIndex={-1}
              fullWidth
              onClick={handleGoogleDrivePickerOpen}
              startIcon={
                <img
                  style={{ width: "3rem", height: "3rem" }}
                  src={googleDriveIcon}
                  alt="Google Drive"
                />
              }
            >
              <Typography variant="h6">Upload from Google Drive</Typography>
            </Button>

            <Typography variant="body2" sx={{ my: 1, color: 'gray', textAlign: 'center' }}>
              — OR —
            </Typography>

            {/* Local file upload option */}
            <input
              type="file"
              id="local-takeout-upload"
              accept=".txt,.json"
              style={{ display: 'none' }}
              onChange={handleLocalFileUpload}
            />
            <label htmlFor="local-takeout-upload">
              <Button
                component="span"
                variant="outlined"
                color="success"
                fullWidth
                sx={{ py: 1.5 }}
              >
                <Typography variant="h6">📁 Upload from Computer</Typography>
              </Button>
            </label>

            {loading ||
              addressInstructionStatus === "done" ||
              transportationInstructionStatus === "done" ||
              categoriesInstructionStatus === "done" ||
              socialPreferencesInstructionStatus === "done" ? (
              <Stack
                direction={"row"}
                justifyContent={"space-around"}
                marginTop={"1.5rem"}
                marginBottom={"1rem"}
              >
                <Stack spacing={1} marginTop={"1rem"}>
                  <div style={styles.statusContainer}>
                    {addressInstructionStatus === "loading" && (
                      <CircularProgress size={20} />
                    )}
                    {addressInstructionStatus === "done" && (
                      <CheckCircleIcon style={{ color: "green" }} />
                    )}
                    {addressInstructionStatus === "error" && (
                      <CancelIcon style={{ color: "red" }} />
                    )}
                    <Typography variant="h6" style={styles.statusTitle}>
                      Location
                    </Typography>
                  </div>
                  <div style={styles.statusContainer}>
                    {transportationInstructionStatus === "loading" && (
                      <CircularProgress size={20} />
                    )}
                    {transportationInstructionStatus === "done" && (
                      <CheckCircleIcon style={{ color: "green" }} />
                    )}
                    {transportationInstructionStatus === "error" && (
                      <CancelIcon style={{ color: "red" }} />
                    )}
                    <Typography variant="h6" style={styles.statusTitle}>
                      Transportation
                    </Typography>
                  </div>
                </Stack>
                <Stack spacing={1} marginTop={"1rem"}>
                  <div style={styles.statusContainer}>
                    {categoriesInstructionStatus === "loading" && (
                      <CircularProgress size={20} />
                    )}
                    {categoriesInstructionStatus === "done" && (
                      <CheckCircleIcon style={{ color: "green" }} />
                    )}
                    {categoriesInstructionStatus === "error" && (
                      <CancelIcon style={{ color: "red" }} />
                    )}
                    <Typography variant="h6" style={styles.statusTitle}>
                      Categories
                    </Typography>
                  </div>
                  <div style={styles.statusContainer}>
                    {socialPreferencesInstructionStatus === "loading" && (
                      <CircularProgress size={20} />
                    )}
                    {socialPreferencesInstructionStatus === "done" && (
                      <CheckCircleIcon style={{ color: "green" }} />
                    )}
                    {socialPreferencesInstructionStatus === "error" && (
                      <CancelIcon style={{ color: "red" }} />
                    )}
                    <Typography variant="h6" style={styles.statusTitle}>
                      Social Preferences
                    </Typography>
                  </div>
                </Stack>
              </Stack>
            ) : null}
          </Paper>
        </div>
      </div>
    </>
  );
};

export default OnboardMethod;
