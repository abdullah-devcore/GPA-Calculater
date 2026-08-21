import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CourseType = "theory" | "lab";
export type GradeEntryMethod = "direct" | "marks";

export type GradeComponent = {
  id: string;
  name: string;
  obtainedMarks: number;
  totalMarks: number;
  weightage: number;
};

export type Course = {
  id: string;
  name: string;
  creditHours: number;
  courseType: CourseType;
  gradeEntryMethod: GradeEntryMethod;
  directGrade?: string;
  components: GradeComponent[];
};

export type Semester = {
  id: string;
  name: string;
  status: "completed" | "in_progress";
  courses: Course[];
};

export type GpaContextValue = {
  semesters: Semester[];
  addSemester: (semester: Omit<Semester, "id" | "courses">) => void;
  updateSemester: (id: string, updates: Partial<Omit<Semester, "id" | "courses">>) => void;
  deleteSemester: (id: string) => void;
  addCourse: (semesterId: string, course: Omit<Course, "id">) => void;
  updateCourse: (semesterId: string, courseId: string, updates: Partial<Omit<Course, "id">>) => void;
  deleteCourse: (semesterId: string, courseId: string) => void;
  calculateCourseGPA: (course: Course) => number;
  calculateSemesterGPA: (semester: Semester) => number;
  calculateOverallGPA: () => number;
  totalCreditHours: number;
  currentSemester: Semester | null;
  bestSemester: Semester | null;
  bestGrade: string;
  loading: boolean;
};

const GpaContext = createContext<GpaContextValue | null>(null);

const STORAGE_KEY = "@gpa_calculator_semesters";

const DEFAULT_THEORY_COMPONENTS: Omit<GradeComponent, "id">[] = [
  { name: "Mid Term", obtainedMarks: 0, totalMarks: 30, weightage: 30 },
  { name: "Final Term", obtainedMarks: 0, totalMarks: 40, weightage: 40 },
  { name: "Presentation", obtainedMarks: 0, totalMarks: 10, weightage: 10 },
  { name: "Assignment", obtainedMarks: 0, totalMarks: 10, weightage: 10 },
  { name: "Quiz", obtainedMarks: 0, totalMarks: 10, weightage: 10 },
];

const DEFAULT_LAB_COMPONENTS: Omit<GradeComponent, "id">[] = [
  { name: "Lab Task", obtainedMarks: 0, totalMarks: 30, weightage: 30 },
  { name: "Final", obtainedMarks: 0, totalMarks: 30, weightage: 30 },
  { name: "Project & Viva", obtainedMarks: 0, totalMarks: 40, weightage: 40 },
];

export function getDefaultComponents(courseType: CourseType): GradeComponent[] {
  const base = courseType === "theory" ? DEFAULT_THEORY_COMPONENTS : DEFAULT_LAB_COMPONENTS;
  return base.map((c) => ({
    ...c,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  }));
}

function percentageToGPA(percentage: number): number {
  if (percentage >= 90) return 4.0;
  if (percentage >= 85) return 4.0;
  if (percentage >= 80) return 3.7;
  if (percentage >= 75) return 3.5;
  if (percentage >= 70) return 3.3;
  if (percentage >= 65) return 3.0;
  if (percentage >= 60) return 2.7;
  if (percentage >= 55) return 2.3;
  if (percentage >= 50) return 2.0;
  if (percentage >= 45) return 1.7;
  if (percentage >= 40) return 1.3;
  return 0.0;
}

export function gradeToGPA(grade: string): number {
  const map: Record<string, number> = {
    "A+": 4.0,
    A: 4.0,
    "B+": 3.5,
    B: 3.0,
    "C+": 2.5,
    C: 2.0,
    D: 1.0,
    F: 0.0,
  };
  return map[grade.toUpperCase()] ?? 0.0;
}

export function gpaToGrade(gpa: number): string {
  if (gpa >= 4.0) return "A+";
  if (gpa >= 3.7) return "A";
  if (gpa >= 3.5) return "B+";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.5) return "C+";
  if (gpa >= 2.0) return "C";
  if (gpa >= 1.0) return "D";
  return "F";
}

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function GpaProvider({ children }: { children: React.ReactNode }) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setSemesters(JSON.parse(val));
        } catch {}
      }
      setLoading(false);
    });
  }, []);

  const persist = useCallback((data: Semester[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, []);

  const addSemester = useCallback(
    (semester: Omit<Semester, "id" | "courses">) => {
      setSemesters((prev) => {
        const next = [...prev, { ...semester, id: genId(), courses: [] }];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateSemester = useCallback(
    (id: string, updates: Partial<Omit<Semester, "id" | "courses">>) => {
      setSemesters((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const deleteSemester = useCallback(
    (id: string) => {
      setSemesters((prev) => {
        const next = prev.filter((s) => s.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const addCourse = useCallback(
    (semesterId: string, course: Omit<Course, "id">) => {
      setSemesters((prev) => {
        const next = prev.map((s) =>
          s.id === semesterId
            ? { ...s, courses: [...s.courses, { ...course, id: genId() }] }
            : s
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateCourse = useCallback(
    (semesterId: string, courseId: string, updates: Partial<Omit<Course, "id">>) => {
      setSemesters((prev) => {
        const next = prev.map((s) =>
          s.id === semesterId
            ? {
                ...s,
                courses: s.courses.map((c) =>
                  c.id === courseId ? { ...c, ...updates } : c
                ),
              }
            : s
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const deleteCourse = useCallback(
    (semesterId: string, courseId: string) => {
      setSemesters((prev) => {
        const next = prev.map((s) =>
          s.id === semesterId
            ? { ...s, courses: s.courses.filter((c) => c.id !== courseId) }
            : s
        );
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const calculateCourseGPA = useCallback((course: Course): number => {
    if (course.gradeEntryMethod === "direct") {
      return gradeToGPA(course.directGrade ?? "");
    }
    if (!course.components || course.components.length === 0) return 0;
    let totalPercentage = 0;
    for (const comp of course.components) {
      if (comp.totalMarks > 0) {
        totalPercentage += (comp.obtainedMarks / comp.totalMarks) * comp.weightage;
      }
    }
    return percentageToGPA(totalPercentage);
  }, []);

  const calculateSemesterGPA = useCallback(
    (semester: Semester): number => {
      if (!semester.courses || semester.courses.length === 0) return 0;
      let totalWeightedGPA = 0;
      let totalCredits = 0;
      for (const course of semester.courses) {
        const gpa = calculateCourseGPA(course);
        totalWeightedGPA += gpa * course.creditHours;
        totalCredits += course.creditHours;
      }
      if (totalCredits === 0) return 0;
      return totalWeightedGPA / totalCredits;
    },
    [calculateCourseGPA]
  );

  const calculateOverallGPA = useCallback((): number => {
    let totalWeightedGPA = 0;
    let totalCredits = 0;
    for (const semester of semesters) {
      for (const course of semester.courses) {
        const gpa = calculateCourseGPA(course);
        totalWeightedGPA += gpa * course.creditHours;
        totalCredits += course.creditHours;
      }
    }
    if (totalCredits === 0) return 0;
    return totalWeightedGPA / totalCredits;
  }, [semesters, calculateCourseGPA]);

  const totalCreditHours = useMemo(() => {
    return semesters.reduce(
      (total, s) => total + s.courses.reduce((t, c) => t + c.creditHours, 0),
      0
    );
  }, [semesters]);

  // Current semester = most recently added in_progress one, or last one overall
  const currentSemester = useMemo((): Semester | null => {
    if (semesters.length === 0) return null;
    const inProgress = semesters.filter((s) => s.status === "in_progress");
    return inProgress.length > 0 ? inProgress[inProgress.length - 1] : semesters[semesters.length - 1];
  }, [semesters]);

  // Best semester = highest GPA semester
  const bestSemester = useMemo((): Semester | null => {
    if (semesters.length === 0) return null;
    let best: Semester | null = null;
    let bestGpaVal = -1;
    for (const s of semesters) {
      if (s.courses.length === 0) continue;
      let totalWeightedGPA = 0;
      let totalCredits = 0;
      for (const course of s.courses) {
        const gpa = (() => {
          if (course.gradeEntryMethod === "direct") return gradeToGPA(course.directGrade ?? "");
          if (!course.components || course.components.length === 0) return 0;
          let pct = 0;
          for (const comp of course.components) {
            if (comp.totalMarks > 0) pct += (comp.obtainedMarks / comp.totalMarks) * comp.weightage;
          }
          return percentageToGPA(pct);
        })();
        totalWeightedGPA += gpa * course.creditHours;
        totalCredits += course.creditHours;
      }
      const semGpa = totalCredits > 0 ? totalWeightedGPA / totalCredits : 0;
      if (semGpa > bestGpaVal) {
        bestGpaVal = semGpa;
        best = s;
      }
    }
    return best;
  }, [semesters]);

  // Best grade across all courses
  const bestGrade = useMemo((): string => {
    let best = 0;
    for (const s of semesters) {
      for (const course of s.courses) {
        const gpa = (() => {
          if (course.gradeEntryMethod === "direct") return gradeToGPA(course.directGrade ?? "");
          if (!course.components || course.components.length === 0) return 0;
          let pct = 0;
          for (const comp of course.components) {
            if (comp.totalMarks > 0) pct += (comp.obtainedMarks / comp.totalMarks) * comp.weightage;
          }
          return percentageToGPA(pct);
        })();
        if (gpa > best) best = gpa;
      }
    }
    return gpaToGrade(best);
  }, [semesters]);

  const value = useMemo(
    () => ({
      semesters,
      addSemester,
      updateSemester,
      deleteSemester,
      addCourse,
      updateCourse,
      deleteCourse,
      calculateCourseGPA,
      calculateSemesterGPA,
      calculateOverallGPA,
      totalCreditHours,
      currentSemester,
      bestSemester,
      bestGrade,
      loading,
    }),
    [
      semesters,
      addSemester,
      updateSemester,
      deleteSemester,
      addCourse,
      updateCourse,
      deleteCourse,
      calculateCourseGPA,
      calculateSemesterGPA,
      calculateOverallGPA,
      totalCreditHours,
      currentSemester,
      bestSemester,
      bestGrade,
      loading,
    ]
  );

  return <GpaContext.Provider value={value}>{children}</GpaContext.Provider>;
}

export function useGpa() {
  const ctx = useContext(GpaContext);
  if (!ctx) throw new Error("useGpa must be used within GpaProvider");
  return ctx;
}
