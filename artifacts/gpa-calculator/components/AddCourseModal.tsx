import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import COLORS from "@/constants/colors";
import {
  Course,
  CourseType,
  GradeComponent,
  GradeEntryMethod,
  getDefaultComponents,
  useGpa,
} from "@/context/GpaContext";

const GRADES = ["A+", "A", "B+", "B", "C+", "C", "D", "F"] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  semesterId: string;
  editingCourse?: Course | null;
};

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function ComponentRow({
  comp,
  index,
  total,
  onChange,
  onDelete,
  onRename,
  onMoveUp,
  onMoveDown,
}: {
  comp: GradeComponent;
  index: number;
  total: number;
  onChange: (id: string, field: keyof GradeComponent, val: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal] = useState(comp.name);

  const handleRenameSubmit = () => {
    if (nameVal.trim()) onRename(comp.id, nameVal.trim());
    setRenaming(false);
  };

  return (
    <View style={cStyles.row}>
      <View style={cStyles.rowHeader}>
        <View style={cStyles.dragHandle}>
          <TouchableOpacity
            onPress={() => onMoveUp(index)}
            disabled={index === 0}
            style={[cStyles.moveBtn, index === 0 && { opacity: 0.3 }]}
          >
            <Feather name="chevron-up" size={14} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onMoveDown(index)}
            disabled={index === total - 1}
            style={[cStyles.moveBtn, index === total - 1 && { opacity: 0.3 }]}
          >
            <Feather name="chevron-down" size={14} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {renaming ? (
          <TextInput
            style={cStyles.renameInput}
            value={nameVal}
            onChangeText={setNameVal}
            autoFocus
            onSubmitEditing={handleRenameSubmit}
            onBlur={handleRenameSubmit}
            returnKeyType="done"
          />
        ) : (
          <TouchableOpacity onPress={() => setRenaming(true)} style={{ flex: 1 }}>
            <Text style={cStyles.compName}>{comp.name}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => onDelete(comp.id)}
          style={cStyles.deleteCompBtn}
        >
          <Feather name="trash-2" size={14} color={COLORS.red} />
        </TouchableOpacity>
      </View>

      <View style={cStyles.marksRow}>
        <View style={cStyles.marksField}>
          <Text style={cStyles.marksLabel}>Obtained</Text>
          <TextInput
            style={cStyles.marksInput}
            value={comp.obtainedMarks.toString()}
            onChangeText={(v) => onChange(comp.id, "obtainedMarks", v)}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        </View>
        <View style={cStyles.marksField}>
          <Text style={cStyles.marksLabel}>Total</Text>
          <TextInput
            style={cStyles.marksInput}
            value={comp.totalMarks.toString()}
            onChangeText={(v) => onChange(comp.id, "totalMarks", v)}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        </View>
        <View style={cStyles.marksField}>
          <Text style={cStyles.marksLabel}>Weight%</Text>
          <TextInput
            style={cStyles.marksInput}
            value={comp.weightage.toString()}
            onChangeText={(v) => onChange(comp.id, "weightage", v)}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        </View>
      </View>
    </View>
  );
}

const cStyles = StyleSheet.create({
  row: {
    backgroundColor: COLORS.surfaceHighlight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dragHandle: {
    marginRight: 8,
  },
  moveBtn: {
    padding: 2,
  },
  compName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },
  renameInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.green,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.green,
    paddingVertical: 0,
  },
  deleteCompBtn: {
    padding: 6,
  },
  marksRow: {
    flexDirection: "row",
    gap: 8,
  },
  marksField: {
    flex: 1,
  },
  marksLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  marksInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    textAlign: "center",
  },
});

export default function AddCourseModal({ visible, onClose, semesterId, editingCourse }: Props) {
  const { addCourse, updateCourse } = useGpa();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [creditHours, setCreditHours] = useState("3");
  const [courseType, setCourseType] = useState<CourseType>("theory");
  const [gradeMethod, setGradeMethod] = useState<GradeEntryMethod>("direct");
  const [directGrade, setDirectGrade] = useState("A");
  const [components, setComponents] = useState<GradeComponent[]>([]);

  useEffect(() => {
    if (editingCourse) {
      setName(editingCourse.name);
      setCreditHours(editingCourse.creditHours.toString());
      setCourseType(editingCourse.courseType);
      setGradeMethod(editingCourse.gradeEntryMethod);
      setDirectGrade(editingCourse.directGrade ?? "A");
      setComponents(editingCourse.components ?? []);
    } else {
      setName("");
      setCreditHours("3");
      setCourseType("theory");
      setGradeMethod("direct");
      setDirectGrade("A");
      setComponents(getDefaultComponents("theory"));
    }
  }, [editingCourse, visible]);

  const handleCourseTypeChange = (type: CourseType) => {
    setCourseType(type);
    if (!editingCourse) {
      setComponents(getDefaultComponents(type));
    }
  };

  const handleCompChange = (id: string, field: keyof GradeComponent, val: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: parseFloat(val) || 0 } : c))
    );
  };

  const handleDeleteComp = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  };

  const handleRenameComp = (id: string, newName: string) => {
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, name: newName } : c)));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setComponents((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    setComponents((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleAddComponent = () => {
    setComponents((prev) => [
      ...prev,
      {
        id: genId(),
        name: `Component ${prev.length + 1}`,
        obtainedMarks: 0,
        totalMarks: 100,
        weightage: 10,
      },
    ]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const courseData: Omit<Course, "id"> = {
      name: name.trim(),
      creditHours: parseFloat(creditHours) || 3,
      courseType,
      gradeEntryMethod: gradeMethod,
      directGrade: gradeMethod === "direct" ? directGrade : undefined,
      components: gradeMethod === "marks" ? components : [],
    };
    if (editingCourse) {
      updateCourse(semesterId, editingCourse.id, courseData);
    } else {
      addCourse(semesterId, courseData);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.grabber} />
            <View style={styles.header}>
              <Text style={styles.title}>
                {editingCourse ? "Edit Course" : "Add Course"}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 500 }}
            >
              <Text style={styles.label}>Course Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Web Technologies"
                placeholderTextColor={COLORS.textMuted}
                autoFocus
              />

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Credit Hours</Text>
                  <TextInput
                    style={styles.input}
                    value={creditHours}
                    onChangeText={setCreditHours}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Course Type</Text>
                  <View style={styles.toggleRow}>
                    {(["theory", "lab"] as CourseType[]).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.toggleBtn, courseType === t && styles.toggleBtnActive]}
                        onPress={() => handleCourseTypeChange(t)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.toggleText, courseType === t && styles.toggleTextActive]}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.label}>Grade Entry Method</Text>
              <View style={styles.methodRow}>
                {(["direct", "marks"] as GradeEntryMethod[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, gradeMethod === m && styles.methodBtnActive]}
                    onPress={() => setGradeMethod(m)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={m === "direct" ? "edit-2" : "bar-chart-2"}
                      size={14}
                      color={gradeMethod === m ? COLORS.black : COLORS.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[styles.methodText, gradeMethod === m && styles.methodTextActive]}
                    >
                      {m === "direct" ? "Direct Grade" : "Marks Based"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {gradeMethod === "direct" ? (
                <>
                  <Text style={styles.label}>Grade</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 20 }}
                  >
                    <View style={styles.gradeRow}>
                      {GRADES.map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.gradeBtn, directGrade === g && styles.gradeBtnActive]}
                          onPress={() => setDirectGrade(g)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.gradeText,
                              directGrade === g && styles.gradeTextActive,
                            ]}
                          >
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </>
              ) : (
                <>
                  <View style={styles.compHeader}>
                    <Text style={styles.label}>Components</Text>
                    <TouchableOpacity onPress={handleAddComponent} style={styles.addCompBtn}>
                      <Feather name="plus" size={14} color={COLORS.green} />
                      <Text style={styles.addCompText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                  {components.map((comp, idx) => (
                    <ComponentRow
                      key={comp.id}
                      comp={comp}
                      index={idx}
                      total={components.length}
                      onChange={handleCompChange}
                      onDelete={handleDeleteComp}
                      onRename={handleRenameComp}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                    />
                  ))}
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={!name.trim()}
            >
              <Text style={styles.saveBtnText}>
                {editingCourse ? "Save Changes" : "Add Course"}
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
    marginBottom: 20,
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
    fontSize: 11,
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
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: COLORS.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row2: {
    flexDirection: "row",
    gap: 12,
  },
  toggleRow: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: COLORS.green,
  },
  toggleText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.black,
  },
  methodRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  methodBtn: {
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
  methodBtnActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  methodText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
  methodTextActive: {
    color: COLORS.black,
  },
  gradeRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 4,
  },
  gradeBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  gradeBtnActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  gradeText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: COLORS.textSecondary,
  },
  gradeTextActive: {
    color: COLORS.black,
  },
  compHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  addCompBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.greenMuted,
  },
  addCompText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.green,
  },
  saveBtn: {
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
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
