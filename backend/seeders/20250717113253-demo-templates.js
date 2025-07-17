'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const templates = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Academic Recommendation',
        description: 'Standard template for academic recommendations (grad school, research positions)',
        category: 'academic',
        prompt_template: `Write a professional academic recommendation letter for {applicantName}, who is applying for {position}. 

Context:
- Applicant: {applicantName}
- Position/Program: {position}
- Relationship: {relationship}
- Duration: {duration}

Key strengths to highlight:
{strengths}

Specific examples:
{examples}

Additional context:
{additionalContext}

Please write in a {tone} tone, with {length} length, and {detailLevel} level of detail.`,
        default_parameters: JSON.stringify({
          tone: 'formal',
          length: 'standard',
          detailLevel: 'comprehensive'
        }),
        created_by: null,
        is_system_template: true,
        is_active: true,
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },

      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Job Application',
        description: 'Template for job recommendations in corporate/professional settings',
        category: 'job',
        prompt_template: `Write a professional job recommendation letter for {applicantName}, who is applying for the position of {position}.

Background:
- Applicant: {applicantName}
- Target Position: {position}
- My relationship with applicant: {relationship}
- Duration of our working relationship: {duration}

Key qualifications and strengths:
{strengths}

Specific examples of their work:
{examples}

Additional relevant information:
{additionalContext}

Please write this in a {tone} tone, with {length} length, and include {detailLevel} level of specific details.`,
        default_parameters: JSON.stringify({
          tone: 'professional',
          length: 'standard',
          detailLevel: 'standard'
        }),
        created_by: null,
        is_system_template: true,
        is_active: true,
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },

      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Scholarship Application',
        description: 'Template for scholarship and fellowship recommendations',
        category: 'scholarship',
        prompt_template: `Write a compelling recommendation letter for {applicantName}, who is applying for {position}.

Applicant Details:
- Name: {applicantName}
- Scholarship/Fellowship: {position}
- My relationship: {relationship}
- Duration I've known them: {duration}

Key strengths and achievements:
{strengths}

Specific examples of excellence:
{examples}

Why they deserve this opportunity:
{additionalContext}

Please write in a {tone} tone, with {length} length, emphasizing their potential with {detailLevel} level of detail.`,
        default_parameters: JSON.stringify({
          tone: 'enthusiastic',
          length: 'detailed',
          detailLevel: 'comprehensive'
        }),
        created_by: null,
        is_system_template: true,
        is_active: true,
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      },

      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'General Purpose',
        description: 'Flexible template for various recommendation needs',
        category: 'general',
        prompt_template: `Write a recommendation letter for {applicantName} for {position}.

Background:
- Applicant: {applicantName}
- Purpose: {position}
- My relationship: {relationship}
- Duration: {duration}

Key points to highlight:
{strengths}

Supporting examples:
{examples}

Additional information:
{additionalContext}

Please write in a {tone} tone, with {length} length, and {detailLevel} level of detail.`,
        default_parameters: JSON.stringify({
          tone: 'formal',
          length: 'standard',
          detailLevel: 'standard'
        }),
        created_by: null,
        is_system_template: true,
        is_active: true,
        usage_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('templates', templates);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('templates', null, {});
  }
};