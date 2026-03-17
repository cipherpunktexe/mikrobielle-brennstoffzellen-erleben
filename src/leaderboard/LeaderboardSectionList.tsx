import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material'
import { uiColor } from '../app/uiColor'
import { UnifiedList, type UnifiedListColumn } from '../common/UnifiedList'
import type { LeaderboardEntry } from '../data/domain'
import type { LeaderboardSection } from './leaderboardSections'

interface LeaderboardSectionListProps {
  sections: LeaderboardSection[]
  expandedSection: string | false
  onExpandedSectionChange: (sectionTitle: string | false) => void
  columns: UnifiedListColumn<LeaderboardEntry>[]
  onOpenEntry: (entry: LeaderboardEntry) => void
}

export function LeaderboardSectionList({
  sections,
  expandedSection,
  onExpandedSectionChange,
  columns,
  onOpenEntry,
}: LeaderboardSectionListProps) {
  return (
    <Stack spacing={1.5}>
      {sections.map((section) => (
        <Accordion
          key={section.title}
          expanded={expandedSection === section.title}
          onChange={(_, isExpanded) => {
            onExpandedSectionChange(isExpanded ? section.title : false)
          }}
          disableGutters
          slotProps={{ transition: { unmountOnExit: true } }}
          sx={{
            mx: 0,
            border: (theme) => `1px solid ${uiColor.leaderboard.sectionBorder(theme)}`,
            borderRadius: '18px',
            bgcolor: (theme) => uiColor.leaderboard.sectionBackground(theme),
            boxShadow: 'none',
            '&::before': {
              display: 'none',
            },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: 0,
              px: { xs: 1, sm: 2 },
              py: 0.25,
              '& .MuiAccordionSummary-content': {
                my: 1.2,
              },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              spacing={1}
              sx={{ width: '100%', minWidth: 0 }}
            >
              <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.98rem', sm: '1.02rem' } }}>
                {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Plätze {section.startRank}-{section.endRank}
              </Typography>
            </Stack>
          </AccordionSummary>

          <AccordionDetails sx={{ px: 0, pb: 0 }}>
            <UnifiedList
              items={section.entries}
              columns={columns}
              getItemKey={(entry) => entry.generatorId}
              ariaLabel={`${section.title} Liste`}
              emptyPrimary="Keine Einträge"
              onItemClick={(entry) => onOpenEntry(entry)}
              getItemAriaLabel={(entry) => `Messverlauf von ${entry.displayName} öffnen`}
              minDesktopWidth={248}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )
}
