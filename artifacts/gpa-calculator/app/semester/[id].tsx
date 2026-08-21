import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AddCourseModal from "@/components/AddCourseModal";
import ConfirmModal from "@/components/ConfirmModal";
import COLORS from "@/constants/colors";
import { Course, gpaToGrade, useGpa } from "@/context/GpaContext";

function GPAMeter({ gpa }: { gpa: number }) {
  const pct = (gpa / 4.0) * 100;
  return (
    <View style={meterStyles.container}>
      <View style={meterStyles.track}>
        <LinearGradient
          colors={[COLORS.greenDark, COLORS.greenLight]}
          style={[meterStyles.fill, { width: `${pct}%` as any }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      <View style={[meterStyles.thumb, { left: `${pct}%` as any }]} />
    </View>
  );
}

const meterStyles = StyleSheet.create({
  container: {
    position: "relative",
    height: 8,
    marginTop: 8,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceHighlight,
    overflow: "hidden",
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  thumb: {
    position: "absolute",
    top: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.greenLight,
    borderWidth: 2,
    borderColor: COLORS.background,
    marginLeft: -7,
  },
});

function CourseCard({
  course,
  onEdit,
  onDelete,
}: {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { calculateCourseGPA } = useGpa();
  const gpa = calculateCourseGPA(course);
  const grade = gpaToGrade(gpa);
  const [expanded, setExpanded] = useState(false);

  const gradeColor =
    grade === "A+" || grade === "A"
      ? COLORS.green
      : grade === "B+" || grade === "B"
      ? "#3B82F6"
      : grade === "C+" || grade === "C"
      ? "#F59E0B"
      : "#EF4444";

  let coursePercent = 0;
  if (course.gradeEntryMethod === "marks" && course.components.length > 0) {
    for (const c of course.components) {
      if (c.totalMarks > 0) {
        coursePercent += (c.obtainedMarks / c.totalMarks) * c.weightage;
      }
    }
  }

  return (
    <View style={cCard.container}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
        style={cCard.header}
      >
        <View style={cCard.typeTag}>
          <Text style={cCard.typeText}>
            {course.courseType === "theory" ? "TH" : "LAB"}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cCard.name}>{course.name}</Text>
          <Text style={cCard.credits}>{course.creditHours} Credit Hours</Text>
        </View>
        <View style={cCard.rightSide}>
          <Text style={[cCard.gpa, { color: gradeColor }]}>{gpa.toFixed(2)}</Text>
          <View style={[cCard.gradeBadge, { backgroundColor: gradeColor }]}>
            <Text style={cCard.gradeText}>{grade}</Text>
          </View>
        </View>
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={COLORS.textMuted}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={cCard.expandedBody}>
          {course.gradeEntryMethod === "direct" ? (
            <View style={cCard.directGradeRow}>
              <Feather name="edit-2" size={14} color={COLORS.textSecondary} />
              <Text style={cCard.directGradeLabel}>Direct Grade:</Text>
              <Text style={[cCard.directGradeVal, { color: gradeColor }]}>
                {course.directGrade}
              </Text>
            </View>
          ) : (
            <>
              <View style={cCard.percentRow}>
                <Text style={cCard.percentLabel}>Total Score</Text>
                <Text style={[cCard.percentVal, { color: gradeColor }]}>
                  {coursePercent.toFixed(1)}%
                </Text>
              </View>
              <GPAMeter gpa={gpa} />
              <View style={cCard.compList}>
                {course.components.map((comp) => {
                  const compScore =
                    comp.totalMarks > 0
                      ? (comp.obtainedMarks / comp.totalMarks) * comp.weightage
                      : 0;
                  return (
                    <View key={comp.id} style={cCard.compRow}>
                      <Text style={cCard.compName}>{comp.name}</Text>
                      <Text style={cCard.compMarks}>
                        {comp.obtainedMarks}/{comp.totalMarks}
                      </Text>
                      <Text style={cCard.compWeight}>×{comp.weightage}%</Text>
                      <Text style={[cCard.compScore, { color: COLORS.green }]}>
                        {compScore.toFixed(1)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={cCard.actions}>
            <TouchableOpacity onPress={onEdit} style={cCard.editBtn}>
              <Feather name="edit-2" size={14} color={COLORS.green} />
              <Text style={cCard.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={cCard.deleteBtn}>
              <Feather name="trash-2" size={14} color={COLORS.red} />
              <Text style={cCard.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const cCard = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  typeTag: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.greenMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  typeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: COLORS.green,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
    marginBottom: 2,
  },
  credits: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },
  rightSide: {
    alignItems: "center",
    gap: 4,
  },
  gpa: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  expandedBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  directGradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
  },
  directGradeLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
  },
  directGradeVal: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  percentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginBottom: 4,
  },
  percentLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
  },
  percentVal: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  compList: {
    marginTop: 12,
    gap: 6,
  },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  compName: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.text,
  },
  compMarks: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
    marginRight: 8,
    minWidth: 50,
    textAlign: "right",
  },
  compWeight: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    marginRight: 8,
    minWidth: 36,
  },
  compScore: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    minWidth: 30,
    textAlign: "right",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.greenMuted,
  },
  editBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.green,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.red,
  },
});

export default function SemesterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { semesters, deleteCourse, calculateSemesterGPA } = useGpa();
  const [addCourseVisible, setAddCourseVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const semester = semesters.find((s) => s.id === id);

  if (!semester) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Semester not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const semGPA = calculateSemesterGPA(semester);
  const totalCredits = semester.courses.reduce((t, c) => t + c.creditHours, 0);

  const handleDeleteCourse = (courseId: string, courseName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfirmDelete({ id: courseId, name: courseName });
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topInset + 8,
            paddingBottom: bottomInset + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{semester.name}</Text>
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  semester.status === "completed"
                    ? COLORS.greenMuted
                    : "rgba(245,158,11,0.15)",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    semester.status === "completed" ? COLORS.green : "#F59E0B",
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    semester.status === "completed" ? COLORS.green : "#F59E0B",
                },
              ]}
            >
              {semester.status === "completed" ? "Completed" : "In Progress"}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={[COLORS.greenGradientStart, COLORS.greenGradientEnd]}
          style={styles.gpaCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.gpaCardRow}>
            <View>
              <Text style={styles.gpaCardLabel}>Semester GPA</Text>
              <View style={styles.gpaRow}>
                <Text style={styles.gpaValue}>{semGPA.toFixed(2)}</Text>
                <Text style={styles.gpaMax}> / 4.0</Text>
              </View>
              <View style={styles.gradeBadgeRow}>
                <View
                  style={[
                    styles.gradeBadge,
                    {
                      backgroundColor:
                        semGPA >= 3.7
                          ? COLORS.green
                          : semGPA >= 3.0
                          ? "#3B82F6"
                          : semGPA >= 2.0
                          ? "#F59E0B"
                          : "#EF4444",
                    },
                  ]}
                >
                  <Text style={styles.gradeBadgeText}>{gpaToGrade(semGPA)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.semStats}>
              <View style={styles.semStat}>
                <Text style={styles.semStatVal}>{semester.courses.length}</Text>
                <Text style={styles.semStatLabel}>Courses</Text>
              </View>
              <View style={styles.semStatDivider} />
              <View style={styles.semStat}>
                <Text style={styles.semStatVal}>{totalCredits}</Text>
                <Text style={styles.semStatLabel}>Credits</Text>
              </View>
            </View>
          </View>
          <View style={styles.gpaProgress}>
            <View style={styles.gpaProgressTrack}>
              <LinearGradient
                colors={[COLORS.greenDark, COLORS.greenLight]}
                style={[
                  styles.gpaProgressFill,
                  { width: `${(semGPA / 4.0) * 100}%` as any },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Courses</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEditingCourse(null);
              setAddCourseVisible(true);
            }}
            style={styles.addCourseBtn}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={14} color={COLORS.green} />
            <Text style={styles.addCourseBtnText}>Add Course</Text>
          </TouchableOpacity>
        </View>

        {semester.courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="book" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Courses Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add courses to calculate your semester GPA
            </Text>
            <TouchableOpacity
              onPress={() => setAddCourseVisible(true)}
              style={styles.emptyAddBtn}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={16} color={COLORS.black} />
              <Text style={styles.emptyAddBtnText}>Add First Course</Text>
            </TouchableOpacity>
          </View>
        ) : (
          semester.courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEdit={() => {
                setEditingCourse(course);
                setAddCourseVisible(true);
              }}
              onDelete={() => handleDeleteCourse(course.id, course.name)}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(bottomInset, 20) + 20 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setEditingCourse(null);
          setAddCourseVisible(true);
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <AddCourseModal
        visible={addCourseVisible}
        onClose={() => {
          setAddCourseVisible(false);
          setEditingCourse(null);
        }}
        semesterId={semester.id}
        editingCourse={editingCourse}
      />

      <ConfirmModal
        visible={!!confirmDelete}
        title="Delete Course"
        message={`Remove "${confirmDelete?.name}" from this semester?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete) deleteCourse(semester.id, confirmDelete.id);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  notFound: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  notFoundText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  backBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.text,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  topBarTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
    flex: 1,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  gpaCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.greenMuted,
  },
  gpaCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  gpaCardLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  gpaRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  gpaValue: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
    lineHeight: 50,
  },
  gpaMax: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
  },
  gradeBadgeRow: {
    marginTop: 8,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  gradeBadgeText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  semStats: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  semStat: {
    alignItems: "center",
    minWidth: 50,
  },
  semStatVal: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
  },
  semStatLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    marginTop: 2,
  },
  semStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.greenMuted,
  },
  gpaProgress: {
    gap: 4,
  },
  gpaProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  gpaProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
  },
  addCourseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.greenMuted,
  },
  addCourseBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.green,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyAddBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.black,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
