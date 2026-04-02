import { isValidObjectId, Types } from "mongoose";
import { ClassRoomModel } from "./classroom.model";

const teacherPopulate = {
  path: "teacher",
  select: "user specialty avatar degree experience achievement rating",
  populate: {
    path: "user",
    select: "name email",
  },
};

const coursePopulate = {
  path: "course",
  select:
    "title slug shortDescription teacher teacherName image level modes status rating studentCount durationText price originalPrice category",
  populate: {
    path: "category",
    select: "name",
  },
};

type FindAllQuery = {
  courseId?: string;
  teacherId?: string;
  isActive?: string;
};

type CreateClassRoomRepoPayload = {
  course: Types.ObjectId;
  teacher: Types.ObjectId;
  className: string;
  mode: "ONLINE" | "OFFLINE";
  scheduleText: string;
  room: string;
  startedAt: Date | null;
  endedAt: Date | null;
  maxStudents: number;
  isActive: boolean;
};

type UpdateClassRoomRepoPayload = Partial<CreateClassRoomRepoPayload>;

function buildFindFilter(query: FindAllQuery) {
  const filter: Record<string, unknown> = {
    isDeleted: false,
  };

  if (query.courseId && isValidObjectId(query.courseId)) {
    filter.course = new Types.ObjectId(query.courseId);
  }

  if (query.teacherId && isValidObjectId(query.teacherId)) {
    filter.teacher = new Types.ObjectId(query.teacherId);
  }

  if (query.isActive === "true") filter.isActive = true;
  if (query.isActive === "false") filter.isActive = false;

  return filter;
}

function applyPopulate<T>(query: T & { populate: (arg: any) => any }) {
  return query.populate(coursePopulate).populate(teacherPopulate);
}

export const classRoomRepository = {
  findAll(query: FindAllQuery) {
    return applyPopulate(
      ClassRoomModel.find(buildFindFilter(query)).sort({ createdAt: -1 })
    );
  },

  findDeleted() {
    return applyPopulate(
      ClassRoomModel.find({ isDeleted: true }).sort({ deletedAt: -1 })
    );
  },

  findById(id: string) {
    return applyPopulate(
      ClassRoomModel.findOne({
        _id: id,
        isDeleted: false,
      })
    );
  },

  findDeletedById(id: string) {
    return applyPopulate(
      ClassRoomModel.findOne({
        _id: id,
        isDeleted: true,
      })
    );
  },

  findAnyById(id: string) {
    return applyPopulate(ClassRoomModel.findById(id));
  },

  findDuplicate(courseId: string, className: string) {
    return ClassRoomModel.findOne({
      course: courseId,
      className,
      isDeleted: false,
    });
  },

  findDuplicateExcludeId(courseId: string, className: string, id: string) {
    return ClassRoomModel.findOne({
      _id: { $ne: id },
      course: courseId,
      className,
      isDeleted: false,
    });
  },

  create(payload: CreateClassRoomRepoPayload) {
    return ClassRoomModel.create(payload);
  },

  updateById(id: string, payload: UpdateClassRoomRepoPayload) {
    return applyPopulate(
      ClassRoomModel.findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        {
          $set: payload,
        },
        {
          new: true,
        }
      )
    );
  },

  softDeleteById(id: string) {
    return applyPopulate(
      ClassRoomModel.findOneAndUpdate(
        {
          _id: id,
          isDeleted: false,
        },
        {
          $set: {
            isDeleted: true,
            isActive: false,
            deletedAt: new Date(),
          },
        },
        {
          new: true,
        }
      )
    );
  },

  restoreById(id: string) {
    return applyPopulate(
      ClassRoomModel.findOneAndUpdate(
        {
          _id: id,
          isDeleted: true,
        },
        {
          $set: {
            isDeleted: false,
            deletedAt: null,
          },
        },
        {
          new: true,
        }
      )
    );
  },

  forceDeleteById(id: string) {
    return applyPopulate(ClassRoomModel.findByIdAndDelete(id));
  },
};