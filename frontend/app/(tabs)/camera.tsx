import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/themed-text";


/*
 Ccamera tab:
  • requests permission
  • shows live preview
  • takes a photo and shows a thumbnail
  • works on iOS/Android and Web */


const ContentPlaceholder = () => (

    <ThemedText style={styles.placeholderText}>Placeholder content...</ThemedText>
  
);


export default function App() {
  return (
    ContentPlaceholder()
  );
}

const styles = StyleSheet.create({
  
  placeholderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#00e1ffff',
  },
});
