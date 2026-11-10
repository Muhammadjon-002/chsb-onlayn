import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
const prisma=new PrismaClient();
async function main(){
 const math=await prisma.subject.upsert({where:{code:'MATH-10'},update:{},create:{name:'Mathematics (Algebra & Geometry)',code:'MATH-10',description:'Matematika fanlari'}});
 const cls=await prisma.classGroup.upsert({where:{name:'10-A'},update:{},create:{name:'10-A',grade:10,stream:'Aniq fanlar',academicYear:'2026-2027'}});
 const passwordHash=await bcrypt.hash('ChangeMe123!',12);
 await prisma.user.upsert({where:{username:'admin'},update:{},create:{username:'admin',passwordHash,fullName:'CHSB Administrator',email:'admin@chsb.local',role:'admin'}});
 await prisma.user.upsert({where:{username:'teacher.demo'},update:{},create:{username:'teacher.demo',passwordHash,fullName:'Demo Teacher',email:'teacher@chsb.local',role:'teacher',assignedClasses:{create:{classId:cls.id}},assignedSubjects:{create:{subjectId:math.id}}}});
 await prisma.user.upsert({where:{username:'student.demo'},update:{},create:{username:'student.demo',passwordHash,fullName:'Demo Student',email:'student@chsb.local',role:'student',studentCode:'ST-DEMO-001',classId:cls.id}});
 console.log('Seed tayyor. Demo login: admin / teacher.demo / student.demo; parol: ChangeMe123!');
}
main().finally(()=>prisma.$disconnect());
