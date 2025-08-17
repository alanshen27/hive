import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    }
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'carol@example.com' },
    update: {},
    create: {
      email: 'carol@example.com',
      name: 'Carol Davis',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    }
  })

  // Create test groups
  const group1 = await prisma.group.upsert({
    where: { id: 'cmeat22ck0002ry4p9ftukjkl' },
    update: {},
    create: {
      id: 'cmeat22ck0002ry4p9ftukjkl',
      name: 'Calculus Study Group',
      description: 'Advanced calculus problems and integration techniques',
      subject: 'Mathematics',
      level: 'Graduate',
      isPrivate: false,
      maxMembers: 10,
      ownerId: user1.id
    }
  })

  const group2 = await prisma.group.upsert({
    where: { id: 'cmeat22ck0002ry4p9ftukjkl2' },
    update: {},
    create: {
      id: 'cmeat22ck0002ry4p9ftukjkl2',
      name: 'Physics Lab Partners',
      description: 'Collaborative physics experiments and problem solving',
      subject: 'Physics',
      level: 'Undergraduate',
      isPrivate: true,
      maxMembers: 5,
      ownerId: user2.id
    }
  })

  // Create many more diverse groups for recommendation algorithm demo
  const additionalGroups = [
    // Mathematics Groups
    { name: 'Linear Algebra Masters', description: 'Deep dive into vector spaces and transformations', subject: 'Mathematics', level: 'Undergraduate', ownerId: user1.id },
    { name: 'Statistics & Probability', description: 'Data analysis and statistical inference', subject: 'Mathematics', level: 'Undergraduate', ownerId: user2.id },
    { name: 'Discrete Mathematics', description: 'Logic, sets, and combinatorial mathematics', subject: 'Mathematics', level: 'Undergraduate', ownerId: user3.id },
    { name: 'Differential Equations', description: 'Solving ODEs and PDEs with applications', subject: 'Mathematics', level: 'Graduate', ownerId: user1.id },
    { name: 'Number Theory', description: 'Prime numbers, modular arithmetic, and cryptography', subject: 'Mathematics', level: 'Graduate', ownerId: user2.id },

    // Computer Science Groups
    { name: 'Data Structures & Algorithms', description: 'Master fundamental CS concepts and problem solving', subject: 'Computer Science', level: 'Undergraduate', ownerId: user1.id },
    { name: 'Machine Learning Fundamentals', description: 'Introduction to ML algorithms and applications', subject: 'Computer Science', level: 'Undergraduate', ownerId: user2.id },
    { name: 'Web Development Bootcamp', description: 'Full-stack development with modern technologies', subject: 'Computer Science', level: 'High School', ownerId: user3.id },
    { name: 'Database Systems', description: 'SQL, NoSQL, and database design principles', subject: 'Computer Science', level: 'Undergraduate', ownerId: user1.id },
    { name: 'Cybersecurity Basics', description: 'Network security, cryptography, and ethical hacking', subject: 'Computer Science', level: 'Professional', ownerId: user2.id },

    // Physics Groups
    { name: 'Quantum Mechanics', description: 'Wave functions, superposition, and quantum phenomena', subject: 'Physics', level: 'Graduate', ownerId: user1.id },
    { name: 'Classical Mechanics', description: 'Newtonian physics, Lagrangian and Hamiltonian mechanics', subject: 'Physics', level: 'Undergraduate', ownerId: user2.id },
    { name: 'Thermodynamics', description: 'Heat, energy, and entropy in physical systems', subject: 'Physics', level: 'Undergraduate', ownerId: user3.id },
    { name: 'Electromagnetism', description: 'Electric and magnetic fields, Maxwell\'s equations', subject: 'Physics', level: 'Undergraduate', ownerId: user1.id },

    // Chemistry Groups
    { name: 'Organic Chemistry', description: 'Carbon compounds, reactions, and mechanisms', subject: 'Chemistry', level: 'Undergraduate', ownerId: user2.id },
    { name: 'Physical Chemistry', description: 'Thermodynamics, kinetics, and quantum chemistry', subject: 'Chemistry', level: 'Graduate', ownerId: user3.id },
    { name: 'Biochemistry', description: 'Chemical processes in living organisms', subject: 'Chemistry', level: 'Undergraduate', ownerId: user1.id },

    // Biology Groups
    { name: 'Cell Biology', description: 'Cellular structure, function, and molecular biology', subject: 'Biology', level: 'Undergraduate', ownerId: user2.id },
    { name: 'Genetics & Genomics', description: 'Heredity, DNA, and genetic engineering', subject: 'Biology', level: 'Undergraduate', ownerId: user3.id },
    { name: 'Ecology & Evolution', description: 'Species interactions and evolutionary processes', subject: 'Biology', level: 'High School', ownerId: user1.id },

    // Engineering Groups
    { name: 'Electrical Engineering', description: 'Circuits, electronics, and electrical systems', subject: 'Engineering', level: 'Undergraduate', ownerId: user2.id },
    { name: 'Mechanical Engineering', description: 'Mechanics, materials, and mechanical systems', subject: 'Engineering', level: 'Undergraduate', ownerId: user3.id },
    { name: 'Civil Engineering', description: 'Infrastructure, structures, and construction', subject: 'Engineering', level: 'Professional', ownerId: user1.id },

    // Language Learning Groups
    { name: 'Spanish Conversation', description: 'Practice Spanish speaking and cultural exchange', subject: 'Language Learning', level: 'High School', ownerId: user2.id },
    { name: 'French Literature', description: 'Reading and analyzing French literary works', subject: 'Language Learning', level: 'Undergraduate', ownerId: user3.id },
    { name: 'Japanese for Beginners', description: 'Learn Japanese grammar, kanji, and conversation', subject: 'Language Learning', level: 'High School', ownerId: user1.id },

    // Business & Economics Groups
    { name: 'Microeconomics', description: 'Individual and firm behavior in markets', subject: 'Economics', level: 'Undergraduate', ownerId: user2.id },
    { name: 'Financial Accounting', description: 'Understanding financial statements and reporting', subject: 'Economics', level: 'Professional', ownerId: user3.id },
    { name: 'Business Strategy', description: 'Strategic management and competitive analysis', subject: 'Economics', level: 'Graduate', ownerId: user1.id },

    // Humanities Groups
    { name: 'World History', description: 'Major historical events and their global impact', subject: 'History', level: 'High School', ownerId: user2.id },
    { name: 'Philosophy of Mind', description: 'Consciousness, identity, and mental phenomena', subject: 'Philosophy', level: 'Undergraduate', ownerId: user3.id },
    { name: 'Creative Writing Workshop', description: 'Fiction, poetry, and creative expression', subject: 'Literature', level: 'Undergraduate', ownerId: user1.id },

    // Medicine & Health Groups
    { name: 'Anatomy & Physiology', description: 'Human body structure and function', subject: 'Medicine', level: 'Undergraduate', ownerId: user2.id },
    { name: 'Pharmacology', description: 'Drug mechanisms, interactions, and therapeutics', subject: 'Medicine', level: 'Graduate', ownerId: user3.id },
    { name: 'Public Health', description: 'Population health, epidemiology, and prevention', subject: 'Medicine', level: 'Professional', ownerId: user1.id }
  ]

  // Create all the additional groups
  const createdGroups = []
  for (const groupData of additionalGroups) {
    const group = await prisma.group.create({
      data: {
        name: groupData.name,
        description: groupData.description,
        subject: groupData.subject,
        level: groupData.level,
        isPrivate: false,
        maxMembers: Math.floor(Math.random() * 8) + 5, // Random size between 5-12
        ownerId: groupData.ownerId
      }
    })
    createdGroups.push(group)
  }

  // Find specific groups for later use
  const mlGroup = createdGroups.find(g => g.name === 'Machine Learning Fundamentals')
  const spanishGroup = createdGroups.find(g => g.name === 'Spanish Conversation')
  const physicsGroup = createdGroups.find(g => g.name === 'Classical Mechanics')

  // Add members to groups
  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: user1.id, groupId: group1.id } },
    update: {},
    create: {
      userId: user1.id,
      groupId: group1.id,
      role: 'leader'
    }
  })

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: user2.id, groupId: group1.id } },
    update: {},
    create: {
      userId: user2.id,
      groupId: group1.id,
      role: 'member'
    }
  })

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: user3.id, groupId: group1.id } },
    update: {},
    create: {
      userId: user3.id,
      groupId: group1.id,
      role: 'member'
    }
  })

  await prisma.groupMember.upsert({
    where: { userId_groupId: { userId: user2.id, groupId: group2.id } },
    update: {},
    create: {
      userId: user2.id,
      groupId: group2.id,
      role: 'leader'
    }
  })

  // Add some sample members to a few additional groups to make them more realistic
  // Add Alice to some Computer Science groups
  await prisma.groupMember.create({
    data: {
      userId: user1.id,
      groupId: createdGroups.find(g => g.name === 'Data Structures & Algorithms')?.id || '',
      role: 'member'
    }
  })

  await prisma.groupMember.create({
    data: {
      userId: user1.id,
      groupId: createdGroups.find(g => g.name === 'Machine Learning Fundamentals')?.id || '',
      role: 'member'
    }
  })

  // Add Bob to some Physics groups
  await prisma.groupMember.create({
    data: {
      userId: user2.id,
      groupId: createdGroups.find(g => g.name === 'Classical Mechanics')?.id || '',
      role: 'member'
    }
  })

  await prisma.groupMember.create({
    data: {
      userId: user2.id,
      groupId: createdGroups.find(g => g.name === 'Thermodynamics')?.id || '',
      role: 'member'
    }
  })

  // Add Carol to some Language Learning groups
  await prisma.groupMember.create({
    data: {
      userId: user3.id,
      groupId: createdGroups.find(g => g.name === 'Spanish Conversation')?.id || '',
      role: 'member'
    }
  })

  await prisma.groupMember.create({
    data: {
      userId: user3.id,
      groupId: createdGroups.find(g => g.name === 'French Literature')?.id || '',
      role: 'member'
    }
  })

  // Create test milestones
  const milestone1 = await prisma.milestone.create({
    data: {
      title: 'Complete Integration by Parts Problems',
      description: 'Solve all integration by parts problems in Chapter 5',
      dueDate: new Date(),
      completed: false,
      groupId: group1.id
    }
  })

  const milestone2 = await prisma.milestone.create({
    data: {
      title: 'Review Chain Rule Applications',
      description: 'Practice chain rule applications with complex functions',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      completed: false,
      groupId: group1.id
    }
  })

  // Add some sample milestones to additional groups
  if (mlGroup) {
    await prisma.milestone.create({
      data: {
        title: 'Implement Linear Regression from Scratch',
        description: 'Build a linear regression model using only numpy, no sklearn',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        completed: false,
        groupId: mlGroup.id
      }
    })
  }

  if (spanishGroup) {
    await prisma.milestone.create({
      data: {
        title: 'Complete Basic Conversation Module',
        description: 'Practice 10 common conversation scenarios in Spanish',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        completed: false,
        groupId: spanishGroup.id
      }
    })
  }

  if (physicsGroup) {
    await prisma.milestone.create({
      data: {
        title: 'Solve Lagrangian Problems Set',
        description: 'Complete problems 1-5 in Chapter 3 using Lagrangian mechanics',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        completed: false,
        groupId: physicsGroup.id
      }
    })
  }

  // Create test messages
  await prisma.message.create({
    data: {
      content: 'Hey everyone! I just finished the first set of integration problems.',
      userId: user1.id,
      groupId: group1.id,
      isAI: false
    }
  })

  await prisma.message.create({
    data: {
      content: 'Great work Alice! I\'m still working on the chain rule problems.',
      userId: user2.id,
      groupId: group1.id,
      isAI: false
    }
  })

  await prisma.message.create({
    data: {
      content: 'I can help explain the integration by parts method if anyone needs it.',
      userId: user3.id,
      groupId: group1.id,
      isAI: false
    }
  })

  // Add some sample messages to additional groups
  if (mlGroup) {
    await prisma.message.create({
      data: {
        content: 'Has anyone tried implementing the k-means clustering algorithm? I\'m having trouble with the convergence criteria.',
        userId: user1.id,
        groupId: mlGroup.id,
        isAI: false
      }
    })
  }

  if (spanishGroup) {
    await prisma.message.create({
      data: {
        content: '¡Hola! ¿Alguien quiere practicar conversación en español esta semana?',
        userId: user3.id,
        groupId: spanishGroup.id,
        isAI: false
      }
    })
  }

  if (physicsGroup) {
    await prisma.message.create({
      data: {
        content: 'Can someone explain the difference between Lagrangian and Hamiltonian mechanics?',
        userId: user2.id,
        groupId: physicsGroup.id,
        isAI: false
      }
    })
  }

  // Create test files
  await prisma.file.create({
    data: {
      name: 'Integration_Problems.pdf',
      url: 'https://example.com/files/integration_problems.pdf',
      size: 2048576,
      type: 'application/pdf',
      userId: user1.id,
      groupId: group1.id
    }
  })

  await prisma.file.create({
    data: {
      name: 'Chain_Rule_Notes.docx',
      url: 'https://example.com/files/chain_rule_notes.docx',
      size: 1048576,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      userId: user2.id,
      groupId: group1.id
    }
  })

  // Create test video sessions
  const videoSession1 = await prisma.videoSession.create({
    data: {
      title: 'Calculus Review Session',
      description: 'Review integration techniques and practice problems',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      status: 'scheduled',
      groupId: group1.id,
      userId: user1.id
    }
  })

  const videoSession2 = await prisma.videoSession.create({
    data: {
      title: 'Chain Rule Practice',
      description: 'Work through chain rule problems together',
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      status: 'scheduled',
      groupId: group1.id,
      userId: user2.id
    }
  })

  // Add participants to video sessions
  await prisma.videoSessionParticipant.create({
    data: {
      userId: user1.id,
      videoSessionId: videoSession1.id,
      joinedAt: new Date()
    }
  })

  await prisma.videoSessionParticipant.create({
    data: {
      userId: user2.id,
      videoSessionId: videoSession1.id,
      joinedAt: new Date()
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log(`📚 Created ${createdGroups.length + 2} study groups across multiple subjects and levels`)
  console.log('🎯 Perfect for testing recommendation algorithms!')
  console.log('')
  console.log('Test users:')
  console.log('- alice@example.com / password123')
  console.log('- bob@example.com / password123')
  console.log('- carol@example.com / password123')
  console.log('')
  console.log('📊 Groups include:')
  console.log('- Mathematics (5 groups): Linear Algebra, Statistics, Discrete Math, Diff Eqs, Number Theory')
  console.log('- Computer Science (5 groups): Data Structures, ML, Web Dev, Databases, Cybersecurity')
  console.log('- Physics (4 groups): Quantum, Classical, Thermodynamics, Electromagnetism')
  console.log('- Chemistry (3 groups): Organic, Physical, Biochemistry')
  console.log('- Biology (3 groups): Cell Biology, Genetics, Ecology')
  console.log('- Engineering (3 groups): Electrical, Mechanical, Civil')
  console.log('- Language Learning (3 groups): Spanish, French, Japanese')
  console.log('- Economics (3 groups): Microeconomics, Accounting, Business Strategy')
  console.log('- Humanities (3 groups): History, Philosophy, Creative Writing')
  console.log('- Medicine (3 groups): Anatomy, Pharmacology, Public Health')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
