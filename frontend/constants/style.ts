import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    paddingTop: 50,
    gap: 15,
    alignContent: "center",
    justifyContent: "flex-start",
    height: "100%",
    alignItems: "center",
    backgroundColor: "rgb(255, 128, 217)",
  },
  logo: {
    width: 200,
    height: 200,
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    marginTop: 70,
    gap: 10,
    alignContent: "center",
    justifyContent: "center",
    width: 400,
  },
  input: {
    width: 400,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    fontSize: 16,
    color: "rgb(196, 32, 146)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  buttonText: {
    color: "rgb(39, 39, 39)",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
  },
});

// You can also export shared values
export const colors = {
  primary: "rgb(255, 57, 195)",
  accent: "rgb(196, 32, 146)",
  white: "rgba(255, 255, 255, 0.95)",
};
