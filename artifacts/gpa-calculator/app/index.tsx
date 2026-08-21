import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polyline } from "react-native-svg";

import AddSemesterModal from "@/components/AddSemesterModal";
import ConfirmModal from "@/components/ConfirmModal";
import COLORS from "@/constants/colors";
import { Semester, gpaToGrade, useGpa } from "@/context/GpaContext";

function GPASparkline() {
  const size = 90;
  const points = [
    { x: 10, y: 65 },
    { x: 30, y: 50 },
    { x: 50, y: 35 },
    { x: 70, y: 20 },
    { x: 90, y: 10 },
  ];
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `M${points[0].x},80 ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L${points[points.length - 1].x},80 Z`;

  return (
    <View style={dashStyles.sparklineWrapper}>
      <Svg width={size + 10} height={85}>
        <Path
          d={areaPath}
          fill="rgba(34,197,94,0.15)"
          strokeWidth={0}
        />
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={COLORS.green}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 5 : 3}
            fill={i === points.length - 1 ? COLORS.green : COLORS.greenDark}
          />
        ))}
      </Svg>
      <View style={dashStyles.lambdaWrapper}>
        <Svg width={44} height={44}>
          <Path
            d="M8,36 L20,8 L32,36"
            fill="none"
            stroke={COLORS.green}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line
            x1="13"
            y1="26"
            x2="30"
            y2="26"
            stroke={COLORS.green}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
      </View>
    </View>
  );
}

function GPABarChart({ semesters }: { semesters: Semester[] }) {
  const { calculateSemesterGPA } = useGpa();
  const data = semesters.map((s) => ({
    label: s.name,
    gpa: calculateSemesterGPA(s),
  }));

  if (data.length === 0) {
    return (
      <View style={chartStyles.empty}>
        <Feather name="bar-chart-2" size={32} color={COLORS.textMuted} />
        <Text style={chartStyles.emptyText}>Add semesters to see GPA chart</Text>
      </View>
    );
  }

  const BAR_WIDTH = 36;
  const CHART_HEIGHT = 140;
  const MAX_VAL = 4.0;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={chartStyles.chart}>
        <View style={chartStyles.yAxis}>
          {[4.0, 3.0, 2.0, 1.0, 0.0].map((v) => (
            <Text key={v} style={chartStyles.yLabel}>
              {v.toFixed(1)}
            </Text>
          ))}
        </View>

        <View style={chartStyles.barsArea}>
          {[4.0, 3.0, 2.0, 1.0, 0.0].map((v) => (
            <View
              key={v}
              style={[
                chartStyles.gridLine,
                { bottom: (v / MAX_VAL) * CHART_HEIGHT },
              ]}
            />
          ))}

          <View style={chartStyles.bars}>
            {data.map((d, i) => {
              const barH = Math.max((d.gpa / MAX_VAL) * CHART_HEIGHT, 4);
              return (
                <View key={i} style={chartStyles.barGroup}>
                  {d.gpa > 0 && (
                    <Text style={chartStyles.barValue}>{d.gpa.toFixed(2)}</Text>
                  )}
                  <LinearGradient
                    colors={[COLORS.greenLight, COLORS.greenDark]}
                    style={[chartStyles.bar, { height: barH, width: BAR_WIDTH }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                  <Text style={chartStyles.barLabel}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const chartStyles = StyleSheet.create({
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    textAlign: "center",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingBottom: 8,
  },
  yAxis: {
    height: 140,
    justifyContent: "space-between",
    paddingRight: 6,
    marginBottom: 20,
  },
  yLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    textAlign: "right",
    width: 28,
  },
  barsArea: {
    position: "relative",
    height: 140 + 20,
    flex: 1,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 140,
    gap: 12,
    paddingHorizontal: 4,
    marginTop: 0,
  },
  barGroup: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 140 + 20,
    paddingBottom: 0,
  },
  bar: {
    borderRadius: 6,
    marginTop: "auto" as any,
  },
  barValue: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.greenLight,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: "center",
  },
});

const dashStyles = StyleSheet.create({
  sparklineWrapper: {
    position: "relative",
    width: 110,
    height: 80,
  },
  lambdaWrapper: {
    position: "absolute",
    bottom: -4,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.greenMuted,
  },
});

function SemesterCard({
  semester,
  onEdit,
  onDelete,
  onNavigate,
}: {
  semester: Semester;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}) {
  const { calculateSemesterGPA, calculateCourseGPA } = useGpa();
  const gpa = calculateSemesterGPA(semester);
  const totalCredits = semester.courses.reduce((t, c) => t + c.creditHours, 0);

  return (
    <TouchableOpacity onPress={onNavigate} activeOpacity={0.8} style={semCard.container}>
      <View style={semCard.header}>
        <View style={{ flex: 1 }}>
          <Text style={semCard.name}>{semester.name}</Text>
          <View style={semCard.statusRow}>
            <View
              style={[
                semCard.statusDot,
                {
                  backgroundColor:
                    semester.status === "completed" ? COLORS.green : "#F59E0B",
                },
              ]}
            />
            <Text style={semCard.statusText}>
              {semester.status === "completed" ? "Completed" : "In Progress"}
            </Text>
          </View>
        </View>
        <View style={semCard.actions}>
          <TouchableOpacity onPress={onEdit} style={semCard.actionBtn}>
            <Feather name="edit-2" size={15} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={[semCard.actionBtn, semCard.deleteBtn]}>
            <Feather name="trash-2" size={15} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNavigate} style={semCard.chevronBtn}>
            <Feather name="chevron-right" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={semCard.stats}>
        <View style={semCard.statItem}>
          <Text style={semCard.statLabel}>Credits</Text>
          <Text style={semCard.statValue}>{totalCredits}</Text>
        </View>
        <View style={semCard.statDivider} />
        <View style={semCard.statItem}>
          <Text style={semCard.statLabel}>Semester GPA</Text>
          <Text style={[semCard.statValue, { color: COLORS.green }]}>
            {gpa.toFixed(2)}
          </Text>
        </View>
        <View style={semCard.statDivider} />
        <View style={semCard.statItem}>
          <Text style={semCard.statLabel}>Courses</Text>
          <Text style={semCard.statValue}>{semester.courses.length}</Text>
        </View>
      </View>

      {semester.courses.length > 0 && (
        <View style={semCard.coursesPreview}>
          {semester.courses.slice(0, 3).map((course) => {
            const cGpa = calculateCourseGPA(course);
            const grade = gpaToGrade(cGpa);
            return (
              <View key={course.id} style={semCard.courseRow}>
                <Text style={semCard.courseName} numberOfLines={1}>
                  {course.name}
                </Text>
                <View style={semCard.courseRight}>
                  <Text style={semCard.courseGpa}>{cGpa.toFixed(2)}</Text>
                  <View
                    style={[
                      semCard.gradeBadge,
                      {
                        backgroundColor:
                          grade === "A+" || grade === "A"
                            ? COLORS.green
                            : grade === "B+" || grade === "B"
                            ? "#3B82F6"
                            : grade === "C+" || grade === "C"
                            ? "#F59E0B"
                            : "#EF4444",
                      },
                    ]}
                  >
                    <Text style={semCard.gradeText}>{grade}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          {semester.courses.length > 3 && (
            <Text style={semCard.moreCourses}>
              +{semester.courses.length - 3} more courses
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const semCard = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  name: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: COLORS.redDark,
  },
  chevronBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceHighlight,
    alignItems: "center",
    justifyContent: "center",
  },
  stats: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  coursesPreview: {
    gap: 8,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  courseName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: COLORS.text,
    marginRight: 8,
  },
  courseRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  courseGpa: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.textSecondary,
  },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 32,
    alignItems: "center",
  },
  gradeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
  },
  moreCourses: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    marginTop: 4,
  },
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    semesters,
    deleteSemester,
    calculateOverallGPA,
    calculateSemesterGPA,
    totalCreditHours,
    currentSemester,
    bestSemester,
    bestGrade,
  } = useGpa();
  const [addSemesterVisible, setAddSemesterVisible] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const overallGPA = calculateOverallGPA();
  const currentSemesterGPA = currentSemester ? calculateSemesterGPA(currentSemester) : 0;
  const bestSemesterGPA = bestSemester ? calculateSemesterGPA(bestSemester) : 0;

  const handleDelete = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfirmDelete({ id, name });
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
            paddingTop: topInset + 16,
            paddingBottom: bottomInset + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>GPA Calculator</Text>

        <LinearGradient
          colors={[
            COLORS.greenGradientStart,
            COLORS.greenGradientMid,
            COLORS.greenGradientEnd,
          ]}
          style={styles.dashCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.dashInner}>
            <View style={styles.dashLeft}>
              <View style={styles.redIconBox}>
                <Feather name="trending-up" size={18} color={COLORS.white} />
              </View>
              <GPASparkline />
              <Text style={styles.dashLeftLabel}>
                {semesters.length > 0
                  ? `${semesters.length} Semester${semesters.length !== 1 ? "s" : ""}`
                  : "No Semesters"}
              </Text>
            </View>

            <View style={styles.dashRight}>
              <Text style={styles.dashTotalLabel}>Cumulative CGPA</Text>
              <Text style={styles.dashGPA}>{overallGPA.toFixed(2)}</Text>
              <Text style={styles.dashMaxGPA}>/ 4.0</Text>

              <View style={styles.dashMiniStats}>
                <View style={styles.dashMiniStat}>
                  <Feather name="layers" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.dashMiniStatVal}>{semesters.length}</Text>
                  <Text style={styles.dashMiniStatLabel}>Sems</Text>
                </View>
                <View style={styles.dashMiniStat}>
                  <Feather name="book-open" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.dashMiniStatVal}>{totalCreditHours}</Text>
                  <Text style={styles.dashMiniStatLabel}>Credits</Text>
                </View>
                <View style={styles.dashMiniBarGroup}>
                  {[0.6, 0.9, 1.0].map((h, i) => (
                    <LinearGradient
                      key={i}
                      colors={[COLORS.greenLight, COLORS.green]}
                      style={[styles.dashMiniBar, { height: h * 36 }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Dashboard stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Feather name="clock" size={16} color={COLORS.green} style={{ marginBottom: 4 }} />
            <Text style={styles.statCardLabel}>Current Sem</Text>
            <Text style={styles.statCardValue}>
              {currentSemester ? currentSemester.name : "—"}
            </Text>
            {currentSemester && (
              <Text style={styles.statCardSub}>{currentSemesterGPA.toFixed(2)} GPA</Text>
            )}
          </View>
          <View style={styles.statCard}>
            <Feather name="book-open" size={16} color={COLORS.green} style={{ marginBottom: 4 }} />
            <Text style={styles.statCardLabel}>Credit Hours</Text>
            <Text style={styles.statCardValue}>{totalCreditHours}</Text>
            <Text style={styles.statCardSub}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="award" size={16} color={COLORS.green} style={{ marginBottom: 4 }} />
            <Text style={styles.statCardLabel}>Best GPA</Text>
            <Text style={[styles.statCardValue, { color: COLORS.green }]}>
              {bestSemester ? bestSemesterGPA.toFixed(2) : "—"}
            </Text>
            <Text style={styles.statCardSub}>Highest</Text>
          </View>
        </View>

        {/* Best Semester card above GPA Progress */}
        {bestSemester && (
          <View style={styles.bestSemCard}>
            <View style={styles.bestSemLeft}>
              <View style={styles.bestSemIconBox}>
                <Feather name="star" size={14} color={COLORS.black} />
              </View>
              <View>
                <Text style={styles.bestSemTitle}>Best Semester</Text>
                <Text style={styles.bestSemName}>{bestSemester.name}</Text>
              </View>
            </View>
            <View style={styles.bestSemRight}>
              <Text style={styles.bestSemGPA}>{bestSemesterGPA.toFixed(2)}</Text>
              <Text style={styles.bestSemMax}>/ 4.0</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>GPA Progress</Text>
            <Text style={styles.sectionSubtitle}>{semesters.length} semesters</Text>
          </View>
          <View style={styles.chartCard}>
            <GPABarChart semesters={semesters} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Semesters</Text>
            <Text style={styles.sectionSubtitle}>
              {semesters.reduce((t, s) => t + s.courses.length, 0)} courses total
            </Text>
          </View>

          {semesters.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="inbox" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Semesters Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button below to add your first semester
              </Text>
            </View>
          ) : (
            semesters.map((semester) => (
              <SemesterCard
                key={semester.id}
                semester={semester}
                onEdit={() => {
                  setEditingSemester(semester);
                  setAddSemesterVisible(true);
                }}
                onDelete={() => handleDelete(semester.id, semester.name)}
                onNavigate={() =>
                  router.push({
                    pathname: "/semester/[id]",
                    params: { id: semester.id },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(bottomInset, 20) + 20 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setEditingSemester(null);
          setAddSemesterVisible(true);
        }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <AddSemesterModal
        visible={addSemesterVisible}
        onClose={() => {
          setAddSemesterVisible(false);
          setEditingSemester(null);
        }}
        editingSemester={editingSemester}
      />

      <ConfirmModal
        visible={!!confirmDelete}
        title="Delete Semester"
        message={`Are you sure you want to delete "${confirmDelete?.name}" and all its courses?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete) deleteSemester(confirmDelete.id);
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
  screenTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  dashCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.greenMuted,
  },
  dashInner: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dashLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  redIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.redDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  dashLeftLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  dashRight: {
    alignItems: "flex-end",
  },
  dashTotalLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  dashGPA: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    color: COLORS.white,
    lineHeight: 54,
  },
  dashMaxGPA: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  dashMiniStats: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  dashMiniStat: {
    alignItems: "center",
    gap: 2,
  },
  dashMiniStatVal: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
  },
  dashMiniStatLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },
  dashMiniBarGroup: {
    flexDirection: "row",
    gap: 3,
    alignItems: "flex-end",
    height: 36,
    marginLeft: 4,
  },
  dashMiniBar: {
    width: 8,
    borderRadius: 3,
  },
  section: {
    marginBottom: 20,
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
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
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
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
    marginBottom: 4,
    textAlign: "center",
  },
  statCardValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
    textAlign: "center",
  },
  statCardSub: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  bestSemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.greenMuted,
  },
  bestSemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bestSemIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.green,
    alignItems: "center",
    justifyContent: "center",
  },
  bestSemTitle: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  bestSemName: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: COLORS.text,
  },
  bestSemRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  bestSemGPA: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: COLORS.green,
  },
  bestSemMax: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: COLORS.textMuted,
  },
});
