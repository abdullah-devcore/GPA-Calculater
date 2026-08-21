import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import COLORS from "@/constants/colors";
import { Semester, useGpa } from "@/context/GpaContext";

type Props = {
  visible: boolean;
  onClose: () => void;
  editingSemester?: Semester | null;
};

export default function AddSemesterModal({ visible, onClose, editingSemester }: Props) {
  const { addSemester, updateSemester, semesters } = useGpa();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"completed" | "in_progress">("in_progress");

  useEffect(() => {
    if (editingSemester) {
      setName(editingSemester.name);
      setStatus(editingSemester.status);
    } else {
      const nextNum = semesters.length + 1;
      setName(`Sem${nextNum}`);
      setStatus("in_progress");
    }
  }, [editingSemester, visible, semesters.length]);

  const handleSave = () => {
    if (!name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (editingSemester) {
      updateSemester(editingSemester.id, { name: name.trim(), status });
    } else {
      addSemester({ name: name.trim(), status });
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.kvWrapper}
        >
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.grabber} />

            <View style={styles.header}>
              <Text style={styles.title}>
                {editingSemester ? "Edit Semester" : "Add Semester"}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Semester Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Sem1, Fall 2024"
              placeholderTextColor={COLORS.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              {(["completed", "in_progress"] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, status === s && styles.statusBtnActive]}
                  onPress={() => setStatus(s)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={s === "completed" ? "check-circle" : "clock"}
                    size={16}
                    color={status === s ? COLORS.black : COLORS.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.statusText, status === s && styles.statusTextActive]}>
                    {s === "completed" ? "Completed" : "In Progress"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={!name.trim()}
            >
              <Text style={styles.saveBtnText}>
                {editingSemester ? "Save Changes" : "Add Semester"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  kvWrapper: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: COLORS.text,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statusBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusBtnActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  statusText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
  statusTextActive: {
    color: COLORS.black,
  },
  saveBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: COLORS.black,
  },
});
