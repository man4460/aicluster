import { LmsCourseContentClient } from "@/systems/lms/components/LmsCourseContentClient";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function LmsManageCoursePage({ params }: Props) {
  const { courseId } = await params;
  return <LmsCourseContentClient courseId={courseId} />;
}
